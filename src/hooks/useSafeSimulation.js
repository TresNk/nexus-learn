import { useState, useCallback, useRef } from 'react';

export const useSafeSimulation = (simulationName) => {
    const [error, setError] = useState(null);
    const [, setIsSafeMode] = useState(false);
    const errorCountRef = useRef(0);

    const wrapCallback = useCallback((callback, context) => {
        return (...args) => {
            try {
                return callback(...args);
            } catch (e) {
                errorCountRef.current += 1;
                
                if (errorCountRef.current >= 3) {
                    setIsSafeMode(true);
                    setError({
                        type: 'recursive',
                        message: `${simulationName} encountered repeated issues. Switched to safe mode.`,
                        originalError: e.message
                    });
                } else {
                    setError({
                        type: 'single',
                        message: `Issue in ${context}: ${e.message}`,
                        originalError: e.message
                    });
                }
                
                console.error(`[SafeSim] Error in ${simulationName} (${context}):`, e);
                throw e;
            }
        };
    }, [simulationName]);

    const wrapUpdate = useCallback((onUpdate, context) => {
        return wrapCallback(onUpdate, context);
    }, [wrapCallback]);

    const safeRun = useCallback(async (fn, context) => {
        try {
            return await fn();
        } catch (e) {
            setError({
                type: 'async',
                message: `Async error in ${context}: ${e.message}`,
                originalError: e.message
            });
            throw e;
        }
    }, []);

    const resetError = useCallback(() => {
        setError(null);
        errorCountRef.current = 0;
        setIsSafeMode(false);
    }, []);

    const clearError = useCallback(() => {
        if (error) {
            setError(null);
        }
    }, [error]);

    const getErrorCount = useCallback(() => errorCountRef.current, []);

    return {
        error,
        resetError,
        clearError,
        wrapCallback,
        wrapUpdate,
        safeRun,
        getErrorCount
    };
};

export const createSafePhysicsEngine = (simulationName) => {
    const errors = [];

    const safePhysicsStep = (stepFn, context) => {
        return (...args) => {
            try {
                return stepFn(...args);
            } catch (e) {
                errors.push({
                    context,
                    error: e.message,
                    timestamp: Date.now()
                });
                
                if (errors.length > 10) {
                    console.warn(`[PhysicsEngine] ${simulationName}: Too many errors, pausing physics`);
                    return null;
                }
                
                console.warn(`[PhysicsEngine] ${simulationName} (${context}):`, e.message);
                return null;
            }
        };
    };

    const getErrors = () => errors;
    const clearErrors = () => errors.length = 0;
    const hasErrors = () => errors.length > 0;

    return {
        safePhysicsStep,
        getErrors,
        clearErrors,
        hasErrors
    };
};

export default useSafeSimulation;