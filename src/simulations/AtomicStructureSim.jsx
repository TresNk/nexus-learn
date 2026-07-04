import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const AtomicStructureSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const nucleusRef = useRef(null);
    const electronRefs = useRef([]);

    const protons = Number(settings.protons) || 6;
    const neutrons = Number(settings.neutrons) || 6;
    const electrons = Number(settings.electrons) || 6;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'SPACE', showGrid: false });
        createLabLighting(scene, { intensity: 1.5 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 15), { radius: 25 });

        // Build Nucleus
        const nucleus = new BABYLON.TransformNode("nucleus", scene);
        for (let i = 0; i < protons; i++) {
            const p = BABYLON.MeshBuilder.CreateSphere("p"+i, { diameter: 0.8 }, scene);
            p.position = new BABYLON.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).scale(1.2);
            p.material = new BABYLON.StandardMaterial("pm", scene);
            p.material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
            p.parent = nucleus;
        }
        for (let i = 0; i < neutrons; i++) {
            const n = BABYLON.MeshBuilder.CreateSphere("n"+i, { diameter: 0.8 }, scene);
            n.position = new BABYLON.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).scale(1.2);
            n.material = new BABYLON.StandardMaterial("nm", scene);
            n.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            n.parent = nucleus;
        }
        nucleusRef.current = nucleus;

        // Build Electrons
        const eNodes = [];
        for (let i = 0; i < electrons; i++) {
            const orbit = i < 2 ? 4 : i < 10 ? 7 : 10;
            const e = BABYLON.MeshBuilder.CreateSphere("e"+i, { diameter: 0.4 }, scene);
            e.material = new BABYLON.StandardMaterial("em", scene);
            e.material.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1);
            e.orbitRadius = orbit;
            e.angle = (i * Math.PI * 2) / (i < 2 ? 2 : i < 10 ? 8 : 18);
            eNodes.push(e);
        }
        electronRefs.current = eNodes;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, [protons, neutrons, electrons]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const updateLoop = () => {
            if (isRunning) {
                electronRefs.current.forEach((e) => {
                    e.angle += 0.02 * (10 / e.orbitRadius);
                    e.position.x = Math.cos(e.angle) * e.orbitRadius;
                    e.position.z = Math.sin(e.angle) * e.orbitRadius;
                    e.position.y = Math.sin(e.angle * 0.5) * (e.orbitRadius * 0.2);
                });

                onUpdate({
                    massNum: protons + neutrons,
                    charge: protons - electrons,
                    stability: neutrons >= protons ? "Stable" : "Unstable"
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, protons, neutrons, electrons, onUpdate]);

    const eduData = {
        formula: "Atomic Mass (A) = Z + N",
        variables: {
            "Protons (Z)": protons,
            "Neutrons (N)": neutrons,
            "Electrons": electrons,
            "Net Charge": protons - electrons
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default AtomicStructureSim;
