import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = "http://localhost:3001";

export const useMultiplayer = (roomId, onConfigSync, onActionSync) => {
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = io(BACKEND_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to multiplayer server', socket.id);
        });

        socket.on('sync_config', (data) => {
            if (onConfigSync) {
                onConfigSync(data);
            }
        });

        socket.on('sync_action', (data) => {
            if (onActionSync) {
                onActionSync(data);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId, onConfigSync, onActionSync]);

    const broadcastConfig = (newConfig) => {
        if (socketRef.current) {
            socketRef.current.emit('sync_config', newConfig);
        }
    };

    const broadcastAction = (actionData) => {
        if (socketRef.current) {
            socketRef.current.emit('sync_action', actionData);
        }
    };

    return { broadcastConfig, broadcastAction };
};