import { useState } from 'react';

export const useTelemetry = () => {
    const [logs, setLogs] = useState([]);

    const logEvent = (module, eventType, details) => {
        const newEntry = {
            timestamp: new Date().toISOString(),
            module,
            eventType,
            details,
        };
        setLogs(prev => [...prev.slice(-99), newEntry]);
        return "STABLE";
    };

    return { logEvent, logs };
};