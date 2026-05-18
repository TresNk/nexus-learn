import React, { useEffect, useRef, useState } from 'react';

const TelemetryGraph = ({ data, activeKey, color = '#3b82f6' }) => {
    const canvasRef = useRef(null);
    const [history, setHistory] = useState([]);
    const maxPoints = 50;

    useEffect(() => {
        if (data && data[activeKey] !== undefined) {
            const val = parseFloat(data[activeKey]);
            if (!isNaN(val)) {
                setHistory(prev => {
                    const next = [...prev, val];
                    if (next.length > maxPoints) return next.slice(1);
                    return next;
                });
            }
        }
    }, [data, activeKey]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || history.length < 2) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw Line
        const min = Math.min(...history) * 0.9;
        const max = Math.max(...history) * 1.1;
        const range = max - min || 1;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        history.forEach((val, i) => {
            const x = (width / (maxPoints - 1)) * i;
            const y = height - ((val - min) / range) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();

        // Area under line
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, color + '33');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();

    }, [history, color]);

    return (
        <div style={{ marginTop: '10px' }}>
            <canvas
                ref={canvasRef}
                width={350}
                height={80}
                style={{ width: '100%', height: '80px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}
            />
        </div>
    );
};

export default TelemetryGraph;