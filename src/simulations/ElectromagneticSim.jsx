import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const ElectromagneticSim = ({ settings, onUpdate, isRunning, onImpact, triggerReset }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const coilRef = useRef(null);
    const magnetRef = useRef(null);
    const time = useRef(0);
    const [annotations, setAnnotations] = useState([]);
    const [showEdu, setShowEdu] = useState(true);
    const [emfValue, setEmfValue] = useState(0);

    const velocity = Number(settings.velocity || 5);
    const turns = Number(settings.turns || 10);
    const B = Number(settings.fieldStrength || 5);

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.05, 1);

        const envPreset = 'LAB_DARK';
        createLabEnvironment(scene, { preset: envPreset, gridSize: 30 });
        createLabLighting(scene, { preset: envPreset });
        createLabCamera(scene, new BABYLON.Vector3(0, 2, 0), { radius: 25 });

        // Rail
        const rail = BABYLON.MeshBuilder.CreateBox("rail", { width: 40, height: 0.2, depth: 1 }, scene);
        rail.position.y = 0.1;
        const railMat = new BABYLON.StandardMaterial("railMat", scene);
        railMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        rail.material = railMat;

        // Magnet (static magnetic field region representation)
        const magnet = BABYLON.MeshBuilder.CreateBox("magnet", { width: 10, height: 4, depth: 4 }, scene);
        magnet.position.x = 0;
        magnet.position.y = 2;
        const magMat = new BABYLON.StandardMaterial("magMat", scene);
        magMat.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
        magMat.alpha = 0.3;
        magnet.material = magMat;
        magnetRef.current = magnet;

        // Coil
        const coil = BABYLON.MeshBuilder.CreateCylinder("coil", { diameter: 3, height: 2, tessellation: 16 }, scene);
        coil.rotation.z = Math.PI / 2;
        coil.position.y = 2;
        coil.position.x = -15;
        const coilMat = new BABYLON.StandardMaterial("coilMat", scene);
        coilMat.diffuseColor = new BABYLON.Color3(1, 0.7, 0.2);
        coilMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);
        coil.material = coilMat;
        coilRef.current = coil;

        engineRef.current = engine;
        sceneRef.current = scene;

        engine.runRenderLoop(() => scene.render());

        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };
    }, []);

    useEffect(() => {
        if (coilRef.current) {
            coilRef.current.position.x = -15;
            time.current = 0;
        }

        // Reset state in next tick to avoid cascading render warning
        const timeout = setTimeout(() => {
            setEmfValue(0);
            setAnnotations([]);
        }, 0);

        return () => clearTimeout(timeout);
    }, [triggerReset, settings.velocity, settings.turns, settings.fieldStrength]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !isRunning) return;

        const physicsStep = () => {
            if (isRunning && coilRef.current) {
                time.current += 0.016;
                const currentVelocity = velocity;
                coilRef.current.position.x += currentVelocity * 0.016;

                // Calculate EMF
                // Magnet region is x: -5 to 5
                // Max EMF when entering or leaving
                const x = coilRef.current.position.x;
                let currentEmf = 0;

                // Simplified Flux gradient model
                if (x > -7 && x < -3) { // Entering
                    currentEmf = B * currentVelocity * turns * 0.1;
                } else if (x > 3 && x < 7) { // Leaving
                    currentEmf = -B * currentVelocity * turns * 0.1;
                } else {
                    currentEmf = 0;
                }

                setEmfValue(currentEmf);

                // Pulse coil color based on EMF
                const intensity = Math.abs(currentEmf) / 10;
                coilRef.current.material.emissiveColor = new BABYLON.Color3(intensity, intensity * 0.7, 0);

                if (onUpdate) {
                    onUpdate({
                        x: x.toFixed(2),
                        emf: currentEmf.toFixed(2) + " mV",
                        flux: (x > -5 && x < 5 ? B : 0).toFixed(1)
                    });
                }

                setAnnotations(prev => {
                    const newAnns = [...prev];
                    if (x > -7 && x < -6.8 && newAnns.length === 0) {
                        newAnns.push({ t: `t=${time.current.toFixed(1)}s`, text: "Coil entering magnetic field. Flux increasing." });
                    }
                    if (x > 0 && x < 0.2 && newAnns.length === 1) {
                        newAnns.push({ t: `t=${time.current.toFixed(1)}s`, text: "Full flux immersion. No change in flux (dΦ/dt = 0)." });
                    }
                    if (x > 3.2 && x < 3.4 && newAnns.length === 2) {
                        newAnns.push({ t: `t=${time.current.toFixed(1)}s`, text: "Coil leaving field. Flux decreasing. Negative EMF induced." });
                    }
                    return newAnns;
                });

                if (x > 15 && onImpact) {
                    onImpact();
                }
            }
        };

        scene.onBeforeRenderObservable.add(physicsStep);
        return () => scene.onBeforeRenderObservable.removeCallback(physicsStep);
    }, [isRunning, velocity, B, turns, onUpdate, onImpact]);

    const eduData = {
        formula: "ε = -N (ΔΦ / Δt)",
        variables: {
            "N": `${turns} (turns)`,
            "B": `${B} T (field)`,
            "v": `${velocity} m/s`,
            "ε": `${emfValue.toFixed(2)} mV`
        },
        annotations: annotations
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            <div style={{
                position: 'absolute', top: '80px', right: '20px',
                background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '12px',
                border: '1px solid #3b82f6', color: 'white', width: '200px'
            }}>
                <div style={{ fontSize: '10px', color: '#3b82f6', marginBottom: '10px' }}>GALVANOMETER</div>
                <div style={{ fontSize: '24px', textAlign: 'center', fontWeight: 'bold' }}>
                    {emfValue.toFixed(1)} <span style={{ fontSize: '12px' }}>mV</span>
                </div>
                <div style={{ height: '4px', background: '#1e293b', marginTop: '10px', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        height: '100%',
                        width: `${Math.min(50, Math.abs(emfValue) * 2)}%`,
                        background: emfValue > 0 ? '#10b981' : '#ef4444',
                        transform: emfValue > 0 ? 'scaleX(1)' : 'scaleX(-1)',
                        transformOrigin: 'left'
                    }} />
                </div>
            </div>
            <button
                onClick={() => setShowEdu(!showEdu)}
                style={{
                    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)',
                    color: '#3b82f6', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
                    fontSize: '12px', zIndex: 200
                }}
            >
                {showEdu ? '📊 Hide Education' : '📊 Show Education'}
            </button>
            {showEdu && <EduOverlay {...eduData} />}
        </div>
    );
};

export default ElectromagneticSim;
