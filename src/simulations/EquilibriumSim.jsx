import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const EquilibriumSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const liquidRef = useRef(null);

    const temp = Number(settings.temp) || 298;
    const concA = Number(settings.concentrationA) || 1.0;
    const concB = Number(settings.concentrationB) || 0.0;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_WHITE', gridSize: 10 });
        createLabLighting(scene, { intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(0, 2, 0), { radius: 12 });

        const flask = BABYLON.MeshBuilder.CreateCylinder("flask", { diameterTop: 1.5, diameterBottom: 3, height: 4 }, scene);
        const flaskMat = new BABYLON.StandardMaterial("flaskMat", scene);
        flaskMat.alpha = 0.2;
        flask.material = flaskMat;
        flask.position.y = 2;

        const liquid = BABYLON.MeshBuilder.CreateCylinder("liquid", { diameterTop: 2.2, diameterBottom: 2.8, height: 2 }, scene);
        const liquidMat = new BABYLON.StandardMaterial("liquidMat", scene);
        liquidMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
        liquidMat.alpha = 0.7;
        liquid.material = liquidMat;
        liquid.position.y = 1;
        liquidRef.current = liquid;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !liquidRef.current) return;

        let curA = concA;
        let curB = concB;
        const K = 2.0 * (temp / 298); // Temperature dependent K

        const updateLoop = () => {
            if (isRunning) {
                // Simplified A <-> B equilibrium approach
                const rateForward = 0.01 * curA;
                const rateBackward = (0.01 / K) * curB;

                curA -= rateForward - rateBackward;
                curB += rateForward - rateBackward;

                // Visual color shift: A is Blue, B is Red
                const ratioB = curB / (curA + curB);
                liquidRef.current.material.diffuseColor = new BABYLON.Color3(0.2 + ratioB * 0.6, 0.4 * (1 - ratioB), 0.8 * (1 - ratioB));

                onUpdate({
                    concentrationA: curA.toFixed(3) + " M",
                    concentrationB: curB.toFixed(3) + " M",
                    equilibriumConstant: K.toFixed(2),
                    status: Math.abs(rateForward - rateBackward) < 0.0001 ? "At Equilibrium" : "Shifting..."
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, temp, concA, concB, onUpdate]);

    const K = 2.0 * (temp / 298);

    const eduData = {
        formula: "K_eq = [Products] / [Reactants]",
        variables: {
            "Temperature": temp + " K",
            "K_eq": K.toFixed(2),
            "Process": "Le Chatelier's Principle"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f4f8', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default EquilibriumSim;
