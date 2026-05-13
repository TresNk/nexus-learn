import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const GasLawsSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const particlesRef = useRef([]);
    const pistonRef = useRef(null);

    const volume = Number(settings.volume) || 50;
    const temp = Number(settings.temperature) || 300;
    const particleCount = Number(settings.particles) || 50;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_WHITE', gridSize: 10 });
        createLabLighting(scene, { intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 15), { radius: 25 });

        // Container
        const container = BABYLON.MeshBuilder.CreateBox("container", { width: 10, height: 10, depth: 10 }, scene);
        container.material = new BABYLON.StandardMaterial("contMat", scene);
        container.material.alpha = 0.1;
        container.position.y = 5;

        // Piston (Top wall moving)
        const piston = BABYLON.MeshBuilder.CreateBox("piston", { width: 9.9, height: 0.5, depth: 9.9 }, scene);
        piston.material = new BABYLON.StandardMaterial("pistMat", scene);
        piston.material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        pistonRef.current = piston;

        // Particles
        const spheres = [];
        for (let i = 0; i < particleCount; i++) {
            const sphere = BABYLON.MeshBuilder.CreateSphere("p" + i, { diameter: 0.3 }, scene);
            sphere.position = new BABYLON.Vector3(
                Math.random() * 8 - 4,
                Math.random() * 8 + 1,
                Math.random() * 8 - 4
            );
            sphere.velocity = new BABYLON.Vector3(
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                (Math.random() - 0.5)
            );
            spheres.push(sphere);
        }
        particlesRef.current = spheres;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, [particleCount]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !pistonRef.current) return;

        const containerHeight = (volume / 100) * 10;
        pistonRef.current.position.y = containerHeight;

        const updateLoop = () => {
            if (isRunning) {
                const speedScale = Math.sqrt(temp / 300) * 0.2;
                let collisions = 0;

                particlesRef.current.forEach(p => {
                    p.position.addInPlace(p.velocity.scale(speedScale));

                    // Bounds check
                    if (Math.abs(p.position.x) > 4.5) { p.velocity.x *= -1; collisions++; }
                    if (Math.abs(p.position.z) > 4.5) { p.velocity.z *= -1; collisions++; }
                    if (p.position.y < 0.5) { p.velocity.y *= -1; collisions++; }
                    if (p.position.y > containerHeight - 0.5) { p.velocity.y *= -1; collisions++; }
                });

                const pressure = (particleCount * temp) / volume;
                onUpdate({
                    pressure: pressure.toFixed(2) + " kPa",
                    avgSpeed: (speedScale * 50).toFixed(1) + " m/s",
                    collisions: collisions
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, volume, temp, particleCount, onUpdate]);

    const pressure = (particleCount * temp) / volume;

    const eduData = {
        formula: "PV = nRT",
        variables: {
            "Volume": volume + " L",
            "Temperature": temp + " K",
            "n (Particles)": particleCount,
            "Pressure": pressure.toFixed(2) + " kPa"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f4f8', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default GasLawsSim;
