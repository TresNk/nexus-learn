import React, { useEffect, useRef } from 'react';

const TelemetryGraph = ({ liveData }) => {
    const canvasRef = useRef(null);
    const historyRef = useRef([]);
    const MAX_POINTS = 100;

    useEffect(() => {
        if (!liveData || Object.keys(liveData).length === 0) return;

        // Extract the first numeric value to chart
        const firstKey = Object.keys(liveData).find(k => typeof Number(liveData[k]) === 'number' && !isNaN(Number(liveData[k])));
        if (!firstKey) return;

        const value = Number(liveData[firstKey]);
        historyRef.current.push(value);
        if (historyRef.current.length > MAX_POINTS) {
            historyRef.current.shift();
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i = 0; i < canvas.width; i += 20) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
        }
        for(let i = 0; i < canvas.height; i += 20) {
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
        }
        ctx.stroke();

        // Draw line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const minVal = Math.min(...historyRef.current) - 5;
        const maxVal = Math.max(...historyRef.current) + 5;
        const range = maxVal - minVal || 1;

        historyRef.current.forEach((val, i) => {
            const x = (i / MAX_POINTS) * canvas.width;
            const y = canvas.height - ((val - minVal) / range) * canvas.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

    }, [liveData]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={100}
            style={{ width: '100%', height: '100px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}
        />
    );
};

export default TelemetryGraph;