import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export const useMultiplayer = (roomId, onConfigSync, onActionSync) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const callbackRef = useRef({ onConfigSync, onActionSync });

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

    const broadcastConfig = (newConfig) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('sync_config', { roomId, config: newConfig });
        }
    };

    const broadcastAction = (actionData) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('sync_action', { roomId, action: actionData });
        }
    };

    return { broadcastConfig, broadcastAction, isConnected };
};