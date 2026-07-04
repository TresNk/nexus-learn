import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const DnaSim = ({ onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_DARK', showGrid: false });
        createLabLighting(scene, { intensity: 1.2 });
        createLabCamera(scene, new BABYLON.Vector3(0, 10, 0), { radius: 30 });

        const root = new BABYLON.TransformNode("dna", scene);

        for (let i = 0; i < 20; i++) {
            const angle = i * 0.5;
            const y = i * 1.5 - 15;

            // Backbones
            const b1 = BABYLON.MeshBuilder.CreateSphere("b1", { diameter: 0.8 }, scene);
            b1.position.set(Math.cos(angle) * 5, y, Math.sin(angle) * 5);
            b1.material = new BABYLON.StandardMaterial("b1m", scene);
            b1.material.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
            b1.parent = root;

            const b2 = BABYLON.MeshBuilder.CreateSphere("b2", { diameter: 0.8 }, scene);
            b2.position.set(Math.cos(angle + Math.PI) * 5, y, Math.sin(angle + Math.PI) * 5);
            b2.material = new BABYLON.StandardMaterial("b2m", scene);
            b2.material.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
            b2.parent = root;

            // Base Pair
            const pair = BABYLON.MeshBuilder.CreateCylinder("pair", { diameter: 0.2, height: 10 }, scene);
            pair.position.set(0, y, 0);
            pair.rotation.y = -angle;
            pair.rotation.z = Math.PI / 2;
            pair.material = new BABYLON.StandardMaterial("pm", scene);
            pair.material.diffuseColor = i % 2 === 0 ? new BABYLON.Color3(1, 0.8, 0.2) : new BABYLON.Color3(0.2, 1, 0.4);
            pair.parent = root;
        }

        rootRef.current = root;
        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const updateLoop = () => {
            if (isRunning && rootRef.current) {
                rootRef.current.rotation.y += 0.01;
                onUpdate({
                    structure: "Double Helix",
                    basePairs: "20 visible",
                    rotation: "Active"
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, onUpdate]);

    const eduData = {
        formula: "DNA: A-T, G-C Base Pairing",
        variables: {
            "Strand Type": "Antiparallel",
            "Pitch": "3.4 nm / turn",
            "Stability": "Hydrogen Bonding"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default DnaSim;
