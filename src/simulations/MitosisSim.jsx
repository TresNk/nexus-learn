import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const MitosisSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const cell1Ref = useRef(null);
    const cell2Ref = useRef(null);

    const speed = Number(settings.speed) || 1;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_WHITE', gridSize: 10 });
        createLabLighting(scene, { intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 15), { radius: 25 });

        const cell1 = BABYLON.MeshBuilder.CreateSphere("cell1", { diameter: 6 }, scene);
        const mat = new BABYLON.StandardMaterial("cellMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0.6);
        mat.alpha = 0.5;
        cell1.material = mat;
        cell1Ref.current = cell1;

        const cell2 = BABYLON.MeshBuilder.CreateSphere("cell2", { diameter: 6 }, scene);
        cell2.material = mat;
        cell2.setEnabled(false);
        cell2Ref.current = cell2;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !cell1Ref.current || !cell2Ref.current) return;

        let progress = 0;

        const updateLoop = () => {
            if (isRunning) {
                progress += 0.005 * speed;
                const p = progress % 1;

                if (p < 0.2) { // Prophase
                    cell1Ref.current.scaling.set(1 + p, 1, 1);
                    onUpdate({ phase: "Prophase", status: "Chromosomes condensing" });
                } else if (p < 0.5) { // Metaphase
                    cell1Ref.current.scaling.set(1.5, 1, 1);
                    onUpdate({ phase: "Metaphase", status: "Aligning at equator" });
                } else if (p < 0.8) { // Anaphase
                    cell1Ref.current.position.x = -p * 2;
                    cell2Ref.current.setEnabled(true);
                    cell2Ref.current.position.x = p * 2;
                    onUpdate({ phase: "Anaphase", status: "Sister chromatids separating" });
                } else { // Telophase/Cytokinesis
                    cell1Ref.current.scaling.set(1, 1, 1);
                    cell2Ref.current.scaling.set(1, 1, 1);
                    onUpdate({ phase: "Cytokinesis", status: "Cell membrane pinching" });
                }
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, speed, onUpdate]);

    const eduData = {
        formula: "Mitosis: 1 Cell → 2 Identical Cells",
        variables: {
            "Total Chromosomes": "46",
            "Speed Scale": speed + "x",
            "Cell Type": "Somatic"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f4f8', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default MitosisSim;
