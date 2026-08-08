import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const BROADCAST_INTERVAL = 66; // ~15Hz instead of 60Hz - reduces bandwidth by 75%

export const useMultiplayer = (roomId, onConfigSync, onActionSync) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const callbackRef = useRef({ onConfigSync, onActionSync });
    
    // Throttle refs for network optimization
    const lastConfigBroadcast = useRef(0);
    const lastActionBroadcast = useRef(0);
    const pendingConfig = useRef(null);
    const pendingAction = useRef(null);

    useEffect(() => {
        callbackRef.current = { onConfigSync, onActionSync };
    }, [onConfigSync, onActionSync]);

    useEffect(() => {
        const socket = io(BACKEND_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join_room', roomId);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('sync_config', (data) => {
            if (callbackRef.current.onConfigSync) {
                callbackRef.current.onConfigSync(data);
            }
        });

        socket.on('sync_action', (data) => {
            if (callbackRef.current.onActionSync) {
                callbackRef.current.onActionSync(data);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId, onConfigSync, onActionSync]);

    // Throttled broadcast for config updates (15Hz max)
    const broadcastConfig = useCallback((newConfig) => {
        if (!socketRef.current || !isConnected) return;
        
        const now = Date.now();
        if (now - lastConfigBroadcast.current >= BROADCAST_INTERVAL) {
            socketRef.current.emit('sync_config', { roomId, config: newConfig });
            lastConfigBroadcast.current = now;
        } else {
            // Store pending update for next interval
            pendingConfig.current = newConfig;
        }
    }, [roomId, isConnected]);

    // Throttled broadcast for action updates (15Hz max)
    const broadcastAction = useCallback((actionData) => {
        if (!socketRef.current || !isConnected) return;
        
        const now = Date.now();
        if (now - lastActionBroadcast.current >= BROADCAST_INTERVAL) {
            socketRef.current.emit('sync_action', { roomId, action: actionData });
            lastActionBroadcast.current = now;
        } else {
            // Store pending update for next interval
            pendingAction.current = actionData;
        }
    }, [roomId, isConnected]);

    // Process pending broadcasts at interval
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (pendingConfig.current && socketRef.current && isConnected) {
                socketRef.current.emit('sync_config', { roomId, config: pendingConfig.current });
                pendingConfig.current = null;
                lastConfigBroadcast.current = Date.now();
            }
            if (pendingAction.current && socketRef.current && isConnected) {
                socketRef.current.emit('sync_action', { roomId, action: pendingAction.current });
                pendingAction.current = null;
                lastActionBroadcast.current = Date.now();
            }
        }, BROADCAST_INTERVAL);

        return () => clearInterval(intervalId);
    }, [roomId, isConnected]);

    return { broadcastConfig, broadcastAction, isConnected };
};