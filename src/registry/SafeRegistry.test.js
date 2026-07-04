import { describe, it, expect } from 'vitest';
import { validateSimulation } from './SafeRegistry';

describe('validateSimulation', () => {
    it('returns valid: true for correctly formatted configurations', () => {
        const sim = {
            id: 'TEST_SIM',
            title: 'Test Sim',
            component: () => null,
            initialConfig: { mass: 10 }
        };
        const result = validateSimulation(sim);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('fails if required fields are missing', () => {
        const sim = {
            id: 'TEST_SIM',
            title: 'Test Sim',
            // missing component and initialConfig
        };
        const result = validateSimulation(sim);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Missing required fields');
    });

    it('fails if id has invalid formatting', () => {
        const sim = {
            id: 'invalid-id-format',
            title: 'Test Sim',
            component: () => null,
            initialConfig: {}
        };
        const result = validateSimulation(sim);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('ID must be uppercase letters and underscores only');
    });

    it('fails if initialConfig is not an object', () => {
        const sim = {
            id: 'TEST_SIM',
            title: 'Test Sim',
            component: () => null,
            initialConfig: "not-an-object" // invalid
        };
        const result = validateSimulation(sim);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('initialConfig must be an object');
    });
});