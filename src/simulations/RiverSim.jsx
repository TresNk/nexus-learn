import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const RiverSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const waterRef = useRef(null);

    const flowRate = Number(settings.flowRate) || 10;
    const slope = Number(settings.slope) || 2;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_DARK', gridSize: 20 });
        createLabLighting(scene, { intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(0, 1, 0), { radius: 15 });

        // Create a river bed path
        const path = [];
        for (let i = -10; i <= 10; i++) {
            path.push(new BABYLON.Vector3(i, Math.sin(i * 0.5) * 0.5, 0));
        }

        const river = BABYLON.MeshBuilder.CreateTube("river", {
            path: path,
            radius: 2,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, scene);

        const mat = new BABYLON.StandardMaterial("riverMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.8);
        mat.alpha = 0.6;
        river.material = mat;
        waterRef.current = river;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !waterRef.current) return;

        const updateLoop = () => {
            if (isRunning) {
                const velocity = Math.sqrt(2 * 9.8 * (slope/100) * 10); // Simplified velocity
                const erosion = (flowRate * velocity * 0.1).toFixed(2);

                // Animate water "flow"
                waterRef.current.material.diffuseTexture = null; // Normally we'd use a bump map offset
                waterRef.current.rotation.x += 0.01 * (flowRate / 10);

                onUpdate({
                    velocity: velocity.toFixed(2) + " m/s",
                    erosionRate: erosion + " kg/s",
                    sedimentLoad: (flowRate * 0.5).toFixed(1) + " tons"
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, flowRate, slope, onUpdate]);

    const eduData = {
        formula: "v = R^(2/3) * S^(1/2) / n (Manning's)",
        variables: {
            "Flow Rate": flowRate + " m³/s",
            "Slope": slope + " %",
            "Energy": (0.5 * flowRate * 1000).toFixed(0) + " J"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default RiverSim;
