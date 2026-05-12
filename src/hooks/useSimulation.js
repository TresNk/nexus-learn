import { useState, useMemo } from 'react';

export const usePrediction = (experimentId, config, isRunning) => {
    const prediction = useMemo(() => {
        if (!isRunning) {
            return calculatePrediction(experimentId, config);
        }
        return null;
    }, [experimentId, config, isRunning]);

    return prediction;
};

export const calculatePrediction = (expId, config) => {
    switch (expId) {
        case 'KINEMATICS_PROJ': {
            const v0 = config.velocity || 30;
            const angle = ((config.angle || 45) * Math.PI) / 180;
            const h0 = config.height || 10;
            const range = (v0 * Math.cos(angle) * (v0 * Math.sin(angle) + Math.sqrt(v0 * Math.sin(angle) ** 2 + 2 * 9.81 * h0))) / 9.81;
            return { type: 'range', value: range.toFixed(1), unit: 'm', label: 'Landing Distance' };
        }
        case 'DYNAMICS_NEWTON': {
            const f = config.force || 50;
            const m = config.mass || 10;
            const a = f / m;
            const d = 0.5 * a * 3 * 3;
            return { type: 'distance', value: d.toFixed(1), unit: 'm', label: 'Distance in 3s' };
        }
        case 'PENDULUM_MOTION': {
            const L = config.length || 8;
            const T = 2 * Math.PI * Math.sqrt(L / 9.81);
            return { type: 'period', value: T.toFixed(2), unit: 's', label: 'Period (T)' };
        }
        case 'FREE_FALL': {
            const h = config.height || 30;
            const t = Math.sqrt(2 * h / 9.81);
            return { type: 'time', value: t.toFixed(2), unit: 's', label: 'Fall Time' };
        }
        case 'HOOKES_LAW': {
            const k = config.k || 20;
            const x = config.displacement || 3;
            const F = k * x;
            return { type: 'force', value: F.toFixed(1), unit: 'N', label: 'Spring Force' };
        }
        case 'WAVE_INTERFERENCE': {
            const f = config.frequency || 1;
            const sep = config.separation || 16;
            const nodes = Math.floor(f * sep / 2);
            return { type: 'nodes', value: nodes, unit: '', label: 'Nodal Lines' };
        }
        case 'DOPPLER_EFFECT': {
            const vs = config.speed || 10;
            const f = config.frequency || 2;
            const shift = Math.abs(f * 343 / (343 - vs) - f);
            return { type: 'shift', value: shift.toFixed(2), unit: 'Hz', label: 'Doppler Shift' };
        }
        case 'SIMPLE_CIRCUITS': {
            const v = config.voltage || 12;
            const r1 = config.r1 || 10;
            const r2 = config.r2 || 20;
            const rTotal = config.config === 'series' ? r1 + r2 : (r1 * r2) / (r1 + r2);
            const current = (v / rTotal * 1000).toFixed(1);
            return { type: 'current', value: current, unit: 'mA', label: 'Total Current' };
        }
        case 'REFRACTION_SNELL': {
            const n1 = config.n1 || 1.0;
            const n2 = config.n2 || 1.5;
            const critical = (Math.asin(n2 / n1) * 180 / Math.PI).toFixed(1);
            return { type: 'critical', value: critical, unit: '°', label: 'Critical Angle' };
        }
        case 'MAGNETIC_FIELD': {
            const sep = config.separation || 10;
            const cx = config.compassX || 5;
            const strength = (1 / (Math.abs(cx + sep / 2) + 1)).toFixed(3);
            return { type: 'field', value: strength, unit: 'T', label: 'Field Strength' };
        }
        case 'ELECTROMAGNETIC_INDUCTION': {
            const v = config.velocity || 5;
            const n = config.turns || 10;
            const b = config.fieldStrength || 5;
            const peakEmf = (v * n * b * 0.1).toFixed(1);
            return { type: 'emf', value: peakEmf, unit: 'mV', label: 'Peak EMF' };
        }
        default:
            return null;
    }
};

export const getFormula = (expId) => {
    const formulas = {
        'KINEMATICS_PROJ': { formula: 'R = v₀²sin(2θ)/g', variables: ['v₀ (initial velocity)', 'θ (angle)', 'g (gravity)'] },
        'DYNAMICS_NEWTON': { formula: 'F = ma', variables: ['F (force)', 'm (mass)', 'a (acceleration)'] },
        'PENDULUM_MOTION': { formula: 'T = 2π√(L/g)', variables: ['L (length)', 'g (gravity)'] },
        'FREE_FALL': { formula: 't = √(2h/g)', variables: ['h (height)', 'g (gravity)'] },
        'HOOKES_LAW': { formula: 'F = -kx', variables: ['k (spring constant)', 'x (displacement)'] },
        'WAVE_INTERFERENCE': { formula: 'd sin(θ) = mλ', variables: ['d (separation)', 'λ (wavelength)', 'm (order)'] },
        'DOPPLER_EFFECT': { formula: "f' = f(v / (v ± vs))", variables: ['v (speed of sound)', 'vs (source speed)'] },
        'SIMPLE_CIRCUITS': { formula: 'V = IR', variables: ['V (voltage)', 'I (current)', 'R (resistance)'] },
        'REFRACTION_SNELL': { formula: 'n₁sin(θ₁) = n₂sin(θ₂)', variables: ['n (refractive index)', 'θ (angle)'] },
        'MAGNETIC_FIELD': { formula: 'B = μ₀I / 2πr', variables: ['r (distance)', 'I (current)'] },
        'ELECTROMAGNETIC_INDUCTION': { formula: 'ε = -N (ΔΦ / Δt)', variables: ['N (turns)', 'Φ (magnetic flux)', 't (time)'] },
    };
    return formulas[expId] || null;
};

export const useTelemetry = () => {
    const [telemetry, setTelemetry] = useState({});
    const [history, setHistory] = useState([]);

    return { telemetry, history, setTelemetry, addToHistory: (entry) => setHistory(prev => [...prev.slice(-50), entry]) };
};