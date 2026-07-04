import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const HeartSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const heartRef = useRef(null);

    const bpm = Number(settings.bpm) || 72;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_DARK', showGrid: false });
        createLabLighting(scene, { intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(0, 0, 0), { radius: 15 });

        const heart = BABYLON.MeshBuilder.CreateSphere("heart", { diameter: 4, segments: 32 }, scene);
        heart.scaling.set(1, 1.3, 0.8);
        const mat = new BABYLON.StandardMaterial("heartMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
        heart.material = mat;
        heartRef.current = heart;

        const leftAtrium = BABYLON.MeshBuilder.CreateSphere("la", { diameter: 1.5 }, scene);
        leftAtrium.position.set(1, 1.5, 0.5);
        leftAtrium.parent = heart;

        const rightAtrium = BABYLON.MeshBuilder.CreateSphere("ra", { diameter: 1.5 }, scene);
        rightAtrium.position.set(-1, 1.5, 0.5);
        rightAtrium.parent = heart;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !heartRef.current) return;

        let time = 0;
        const freq = bpm / 60;

        const updateLoop = () => {
            if (isRunning) {
                time += 0.016;
                const beat = Math.sin(time * freq * Math.PI * 2);
                const scale = 1 + Math.max(0, beat) * 0.15;
                heartRef.current.scaling.set(scale, scale * 1.3, scale * 0.8);

                onUpdate({
                    pulse: beat > 0.8 ? "Systole" : "Diastole",
                    bpm: bpm,
                    cycle: (time % (1/freq)).toFixed(2) + "s"
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, bpm, onUpdate]);

    const eduData = {
        formula: "Cardiac Output = Heart Rate × Stroke Volume",
        variables: {
            "Heart Rate": bpm + " BPM",
            "Cycle Phase": "Automatic Sinus Rhythm",
            "Oxygenation": "Pulmonary Circuit"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default HeartSim;
