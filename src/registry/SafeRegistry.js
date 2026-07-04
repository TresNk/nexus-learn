import React, { useState } from 'react';
import GenericSimulation from '../simulations/GenericSimulation';

export const validateSimulation = (sim) => {
    const requiredFields = ['id', 'title', 'component', 'initialConfig'];
    const missingFields = requiredFields.filter(field => !sim[field]);
    
    if (missingFields.length > 0) {
        return {
            valid: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
        };
    }

    if (typeof sim.initialConfig !== 'object' || sim.initialConfig === null) {
        return {
            valid: false,
            error: 'initialConfig must be an object'
        };
    }

    if (!sim.id.match(/^[A-Z0-9_]+$/)) {
        return {
            valid: false,
            error: 'ID must be uppercase letters, numbers and underscores only'
        };
    }

    return { valid: true };
};

export const safeAddExperiment = (subjects, subjectId, newExperiment) => {
    const validation = validateSimulation(newExperiment);
    
    if (!validation.valid) {
        console.warn(`[SafeRegistry] Skipped adding "${newExperiment.id}": ${validation.error}`);
        return { success: false, error: validation.error };
    }

    const subjectIndex = subjects.findIndex(s => s.id === subjectId);
    if (subjectIndex === -1) {
        return { success: false, error: `Subject "${subjectId}" not found` };
    }

    const exists = subjects[subjectIndex].experiments.some(exp => exp.id === newExperiment.id);
    if (exists) {
        return { success: false, error: `Experiment "${newExperiment.id}" already exists` };
    }

    const newSubjects = [...subjects];
    newSubjects[subjectIndex] = {
        ...newSubjects[subjectIndex],
        experiments: [...newSubjects[subjectIndex].experiments, newExperiment]
    };

    return { success: true, subjects: newSubjects };
};

export const safeRemoveExperiment = (subjects, experimentId) => {
    const newSubjects = subjects.map(subject => ({
        ...subject,
        experiments: subject.experiments.filter(exp => exp.id !== experimentId)
    }));

    return { success: true, subjects: newSubjects };
};

export const getExperimentById = (subjects, experimentId) => {
    for (const subject of subjects) {
        const experiment = subject.experiments.find(exp => exp.id === experimentId);
        if (experiment) return experiment;
    }
    return null;
};

export const generateExperimentConfig = (topic, aiResponse) => {
    try {
        const config = {
            id: `${topic.toUpperCase().replace(/\s+/g, '_')}_GEN`,
            title: topic,
            icon: 'Zap',
            component: GenericSimulation,
            description: aiResponse.description || `Explore ${topic} concepts`,
            difficulty: aiResponse.difficulty || 1,
            sims: aiResponse.features || [],
            initialConfig: aiResponse.config || {},
            isGenerated: true,
            generatedAt: new Date().toISOString()
        };

        return config;
    } catch (e) {
        console.error('[SafeRegistry] Failed to generate config:', e);
        return null;
    }
};

export const useSafeRegistry = (initialSubjects) => {
    const [subjects, setSubjects] = useState(initialSubjects);
    const [failedSims, setFailedSims] = useState([]);

    const addExperiment = (subjectId, experiment) => {
        const result = safeAddExperiment(subjects, subjectId, experiment);
        if (result.success) {
            setSubjects(result.subjects);
            return { success: true };
        }
        return result;
    };

    const removeExperiment = (experimentId) => {
        const result = safeRemoveExperiment(subjects, experimentId);
        if (result.success) {
            setSubjects(result.subjects);
        }
        return result;
    };

    const markFailed = (experimentId, error) => {
        setFailedSims(prev => [...prev.filter(f => f.id !== experimentId), { id: experimentId, error, timestamp: Date.now() }]);
    };

    const clearFailed = (experimentId) => {
        setFailedSims(prev => prev.filter(f => f.id !== experimentId));
    };

    const addGeneratedSim = (topic, aiResponse) => {
        const config = generateExperimentConfig(topic, aiResponse);
        if (!config) return { success: false, error: 'Failed to generate config' };
        
        const validation = validateSimulation(config);
        if (!validation.valid) return validation;

        return addExperiment('PHYSICS', config);
    };

    const addCreatorSim = (draft) => {
        const config = {
            ...draft,
            id: draft.id.toUpperCase(),
            component: GenericSimulation,
            isCreator: true,
            icon: 'Activity'
        };

        const validation = validateSimulation(config);
        if (!validation.valid) return validation;

        setSubjects(prev => {
            let targetSubjectId = draft.subject;
            const exists = prev.some(s => s.id === targetSubjectId);

            let updated;
            if (!exists) {
                const newSubject = {
                    id: targetSubjectId,
                    title: targetSubjectId.charAt(0) + targetSubjectId.slice(1).toLowerCase(),
                    color: '#8b5cf6',
                    description: `Custom courses in ${targetSubjectId.toLowerCase()}.`,
                    experiments: []
                };
                updated = [...prev, newSubject];
            } else {
                updated = [...prev];
            }

            const subjectIndex = updated.findIndex(s => s.id === targetSubjectId);
            const experimentExists = updated[subjectIndex].experiments.some(exp => exp.id === config.id);

            if (!experimentExists) {
                updated[subjectIndex] = {
                    ...updated[subjectIndex],
                    experiments: [...updated[subjectIndex].experiments, config]
                };
            }

            return updated;
        });

        return { success: true };
    };

    return {
        subjects,
        addExperiment,
        removeExperiment,
        markFailed,
        clearFailed,
        failedSims,
        addGeneratedSim,
        addCreatorSim
    };
};