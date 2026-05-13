import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const RockCycleSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const rockRef = useRef(null);

    const temperature = Number(settings.temperature) || 500;
    const pressure = Number(settings.pressure) || 50;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_DARK', gridSize: 20 });
        createLabLighting(scene, { intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(0, 2, 0), { radius: 10 });

        const rock = BABYLON.MeshBuilder.CreatePolyhedron("rock", { type: 1, size: 2 }, scene);
        const mat = new BABYLON.StandardMaterial("rockMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        rock.material = mat;
        rockRef.current = rock;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !rockRef.current) return;

        const updateLoop = () => {
            if (isRunning) {
                // Change color and shape based on Temp/Pressure
                const r = temperature / 1500;
                const p = pressure / 100;

                rockRef.current.material.diffuseColor = new BABYLON.Color3(0.5 + r*0.5, 0.5 - r*0.2, 0.5 - p*0.3);
                rockRef.current.scaling.set(1 + p*0.2, 1 - p*0.2, 1 + p*0.1);

                let type = "Sedimentary";
                if (temperature > 1000) type = "Igneous (Magma)";
                else if (pressure > 70 || temperature > 600) type = "Metamorphic";

                onUpdate({
                    rockType: type,
                    state: temperature > 1200 ? "Molten" : "Solid",
                    density: (2.5 + p).toFixed(2) + " g/cm³"
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, temperature, pressure, onUpdate]);

    const eduData = {
        formula: "Phase Change: P, T Equilibrium",
        variables: {
            "Temperature": temperature + " °C",
            "Pressure": pressure + " kbar",
            "Process": temperature > 1000 ? "Melting" : pressure > 70 ? "Metamorphism" : "Lithification"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default RockCycleSim;
