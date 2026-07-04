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
        case 'CHEM_TITRATION': {
            const ma = config.acidConcentration || 0.1;
            const va = config.acidVolume || 25;
            const mb = config.baseConcentration || 0.1;
            const veq = (ma * va) / mb;
            return { type: 'volume', value: veq.toFixed(1), unit: 'mL', label: 'Equivalence Point' };
        }
        case 'PHOTOSYNTHESIS': {
            const light = config.lightIntensity || 50;
            const co2 = config.co2Level || 400;
            const rate = (light / 100) * (co2 / 400) * 10;
            return { type: 'rate', value: rate.toFixed(2), unit: 'mmol/s', label: 'Oxygen Rate' };
        }
        case 'CLIMATE_PATTERNS': {
            const tilt = config.tilt || 23.5;
            const month = config.month || 'June';
            const monthOffset = month === 'June' ? 1 : month === 'December' ? -1 : 0;
            const intensity = 1000 * Math.cos((tilt * -monthOffset * Math.PI) / 180);
            return { type: 'insolation', value: intensity.toFixed(0), unit: 'W/m²', label: 'Solar Intensity' };
        }
        case 'PLATE_TECTONICS': {
            const speed = config.subductionSpeed || 5;
            const displacement = speed * 10; // in 10 years mock
            return { type: 'displacement', value: displacement.toFixed(1), unit: 'cm', label: '10yr Movement' };
        }
        case 'CIRCULAR_MOTION': {
            const r = config.radius || 10;
            const v = config.velocity || 5;
            const a = (v * v) / r;
            return { type: 'accel', value: a.toFixed(2), unit: 'm/s²', label: 'Centripetal Accel' };
        }
        case 'GAS_LAWS': {
            const v = config.volume || 50;
            const t = config.temperature || 300;
            const p = (8.314 * t) / v;
            return { type: 'pressure', value: p.toFixed(2), unit: 'atm', label: 'Calculated Pressure' };
        }
        case 'ATOMIC_STRUCTURE': {
            const p = config.protons || 6;
            const n = config.neutrons || 6;
            return { type: 'mass', value: p + n, unit: 'u', label: 'Atomic Mass' };
        }
        case 'CHEM_EQUILIBRIUM': {
            const t = config.temp || 298;
            const keq = Math.exp(-1000 / (8.314 * t)) * 100;
            return { type: 'keq', value: keq.toFixed(2), unit: '', label: 'Equilibrium Constant' };
        }
        case 'HUMAN_HEART': {
            const bpm = config.bpm || 72;
            const sv = 70; // stroke volume avg
            const co = (bpm * sv) / 1000;
            return { type: 'output', value: co.toFixed(1), unit: 'L/min', label: 'Cardiac Output' };
        }
        case 'RIVER_DYNAMICS': {
            const s = config.slope || 5;
            const v = Math.sqrt(2 * 9.8 * (s / 100) * 10);
            return { type: 'velocity', value: v.toFixed(2), unit: 'm/s', label: 'Flow Velocity' };
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
        'CIRCULAR_MOTION': { formula: 'Fc = mv²/r', variables: ['m (mass)', 'v (velocity)', 'r (radius)'] },
        'GAS_LAWS': { formula: 'PV = nRT', variables: ['P (pressure)', 'V (volume)', 'T (temperature)'] },
        'CHEM_TITRATION': { formula: 'M₁V₁ = M₂V₂', variables: ['M (molarity)', 'V (volume)'] },
        'ATOMIC_STRUCTURE': { formula: 'Mass = p + n', variables: ['p (protons)', 'n (neutrons)'] },
        'CHEM_EQUILIBRIUM': { formula: 'Kc = [C][D]/[A][B]', variables: ['[X] (concentration)'] },
        'CELL_STRUCTURE': { formula: 'A = πr²', variables: ['r (cell radius)'] },
        'PHOTOSYNTHESIS': { formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', variables: ['CO₂ (carbon dioxide)', 'H₂O (water)'] },
        'DNA_STRUCTURE': { formula: 'A=T, G≡C (Chargaff)', variables: ['Base pairs'] },
        'HUMAN_HEART': { formula: 'CO = HR × SV', variables: ['HR (heart rate)', 'SV (stroke volume)'] },
        'PLATE_TECTONICS': { formula: 'v = d / t', variables: ['v (velocity)', 'd (distance)', 't (time)'] },
        'CLIMATE_PATTERNS': { formula: 'I = S₀ cos(θ)', variables: ['I (insolation)', 'S₀ (solar constant)', 'θ (angle)'] },
        'WATER_CYCLE': { formula: 'P = E + R + ΔS', variables: ['P (precip)', 'E (evap)', 'R (runoff)'] },
        'ROCK_CYCLE': { formula: 'T, P Equilibrium', variables: ['T (temp)', 'P (pressure)'] },
        'RIVER_DYNAMICS': { formula: 'v = (1/n)R^(2/3)S^(1/2)', variables: ['n (roughness)', 'R (radius)', 'S (slope)'] }
    };
    return formulas[expId] || null;
};

export const useTelemetry = () => {
    const [telemetry, setTelemetry] = useState({});
    const [history, setHistory] = useState([]);

    return { telemetry, history, setTelemetry, addToHistory: (entry) => setHistory(prev => [...prev.slice(-50), entry]) };
};