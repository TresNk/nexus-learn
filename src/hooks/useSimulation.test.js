import { describe, it, expect } from 'vitest';
import { calculatePrediction } from './useSimulation';

describe('calculatePrediction', () => {
    it('calculates range for KINEMATICS_PROJ correctly', () => {
        const config = { velocity: 30, angle: 45, height: 10 };
        const result = calculatePrediction('KINEMATICS_PROJ', config);
        expect(result.type).toBe('range');
        expect(result.unit).toBe('m');
        // Math check: v0 = 30, angle = 45 deg, h0 = 10.
        expect(Number(result.value)).toBeGreaterThan(0);
    });

    it('calculates distance for DYNAMICS_NEWTON correctly', () => {
        const config = { force: 50, mass: 10 };
        const result = calculatePrediction('DYNAMICS_NEWTON', config);
        expect(result.type).toBe('distance');
        // a = 50/10 = 5. d = 0.5 * 5 * 3 * 3 = 22.5
        expect(result.value).toBe('22.5');
        expect(result.unit).toBe('m');
    });

    it('calculates period for PENDULUM_MOTION correctly', () => {
        const config = { length: 8 };
        const result = calculatePrediction('PENDULUM_MOTION', config);
        expect(result.type).toBe('period');
        // T = 2 * pi * sqrt(8/9.81) ≈ 5.67
        expect(result.value).toBe('5.67');
        expect(result.unit).toBe('s');
    });

    it('returns null for unknown experiments', () => {
        expect(calculatePrediction('UNKNOWN_EXP', {})).toBeNull();
    });
});