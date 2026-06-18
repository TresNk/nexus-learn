import { useState, useEffect } from 'react';

export const usePrediction = (experimentId, config, isRunning) => {
    const [prediction, setPrediction] = useState(null);

    useEffect(() => {
        if (!isRunning) {
            setPrediction(calculatePrediction(experimentId, config));
        }
    }, [isRunning]);

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
        case 'ORBITAL_MECH': return { type: 'velocity', value: (config.velocity * 1.5).toFixed(1), unit: 'km/s', label: 'Escape Velocity' };
        case 'ADV_COLLISIONS': return { type: 'momentum', value: (config.mass1 * config.elasticity).toFixed(1), unit: 'kg m/s', label: 'Final Momentum' };
        case 'FLUID_DYNAMICS': return { type: 'velocity', value: (config.pressure / (config.radius2 || 1)).toFixed(1), unit: 'm/s', label: 'Exit Velocity' };
        case 'THERMODYNAMICS': return { type: 'efficiency', value: (1 - config.tempLow / config.tempHigh).toFixed(2), unit: '', label: 'Carnot Efficiency' };
        case 'OPTICS': return { type: 'focal', value: (config.focalLength * config.index).toFixed(1), unit: 'cm', label: 'Effective Focal' };
        case 'ADV_EM': return { type: 'voltage', value: (config.turns * config.velocity * 0.1).toFixed(1), unit: 'V', label: 'Induced EMF' };
        case 'STATICS_STRUCTURES': return { type: 'tension', value: (config.load / config.nodes).toFixed(1), unit: 'N', label: 'Max Tension' };
        case 'MOLECULAR_BUILDER': return { type: 'angle', value: (180 - config.ligands * 10).toFixed(1), unit: '°', label: 'Bond Angle' };
        case 'TITRATION_LAB': return { type: 'ph', value: (7 + config.volume * 0.05).toFixed(1), unit: '', label: 'Final pH' };
        case 'IDEAL_GAS': return { type: 'pressure', value: (8.314 * config.temp / config.volume).toFixed(1), unit: 'atm', label: 'Pressure' };
        case 'KINETICS': return { type: 'rate', value: Math.exp(-config.activation / (8.314 * config.temp)).toFixed(4), unit: 's⁻¹', label: 'Rate Constant k' };
        case 'LATTICE': return { type: 'density', value: (config.size * 2).toFixed(1), unit: 'g/cm³', label: 'Density' };
        case 'OSMOSIS': return { type: 'gradient', value: Math.abs(config.soluteInside - config.soluteOutside).toFixed(2), unit: 'M', label: 'Concentration Gradient' };
        case 'NEURON': return { type: 'potential', value: (config.stimulus > Math.abs(config.threshold) ? 40 : -70).toFixed(1), unit: 'mV', label: 'Action Potential' };
        case 'DNA_REPLICATION': return { type: 'time', value: (config.length / config.speed).toFixed(1), unit: 's', label: 'Replication Time' };
        case 'ECOSYSTEM': return { type: 'population', value: (config.deer - config.wolves * 2).toFixed(0), unit: 'ind', label: 'Equilibrium Prey' };
        case 'EPIDEMIOLOGY': return { type: 'peak', value: (config.population * (1 - 1/config.r0)).toFixed(0), unit: 'cases', label: 'Peak Infected' };
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
        'ORBITAL_MECH': { formula: 'v = √(GM/r)', variables: ['v (velocity)', 'M (mass)'] },
        'ADV_COLLISIONS': { formula: 'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\'', variables: ['m (mass)', 'v (velocity)'] },
        'FLUID_DYNAMICS': { formula: 'A₁v₁ = A₂v₂', variables: ['A (area)', 'v (velocity)'] },
        'THERMODYNAMICS': { formula: 'η = 1 - Tc/Th', variables: ['η (efficiency)', 'T (temp)'] },
        'OPTICS': { formula: '1/f = 1/dₒ + 1/dᵢ', variables: ['f (focal length)', 'd (distance)'] },
        'ADV_EM': { formula: 'ε = -N(dΦ/dt)', variables: ['ε (EMF)', 'N (turns)'] },
        'STATICS_STRUCTURES': { formula: 'ΣF = 0', variables: ['F (force)'] },
        'MOLECULAR_BUILDER': { formula: 'AXmEn', variables: ['X (ligands)', 'E (lone pairs)'] },
        'TITRATION_LAB': { formula: 'M₁V₁ = M₂V₂', variables: ['M (molarity)', 'V (volume)'] },
        'IDEAL_GAS': { formula: 'PV = nRT', variables: ['P (pressure)', 'V (volume)', 'T (temp)'] },
        'KINETICS': { formula: 'k = Ae^(-Ea/RT)', variables: ['k (rate)', 'Ea (activation)'] },
        'LATTICE': { formula: 'ρ = nA / VcNA', variables: ['ρ (density)', 'A (atomic weight)'] },
        'OSMOSIS': { formula: 'π = iMRT', variables: ['π (osmotic pressure)', 'M (molarity)'] },
        'NEURON': { formula: 'V = I·R', variables: ['V (voltage)', 'I (current)'] },
        'DNA_REPLICATION': { formula: 't = L/v', variables: ['L (length)', 'v (speed)'] },
        'ECOSYSTEM': { formula: 'dP/dt = rP(1 - P/K)', variables: ['P (population)', 'K (capacity)'] },
        'EPIDEMIOLOGY': { formula: 'S + I + R = N', variables: ['S (susceptible)', 'I (infected)'] }
    };
    return formulas[expId] || null;
};

export const useTelemetry = (experimentId, settings, isRunning) => {
    const [telemetry, setTelemetry] = useState({});
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!isRunning) {
            setTelemetry({});
            setHistory([]);
        }
    }, [isRunning]);

    return { telemetry, history, setTelemetry, addToHistory: (entry) => setHistory(prev => [...prev.slice(-50), entry]) };
};