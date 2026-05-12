import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const CircuitSim = ({ settings, onUpdate, isRunning }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const wireRefs = useRef([]);
    const particleSystemsRef = useRef([]);
    const [annotations] = useState([]);

    const voltage = Number(settings.voltage) || 12;
    const r1 = Number(settings.r1) || 10;
    const r2 = Number(settings.r2) || 20;
    const config = settings.config || 'series';
    
    let totalR, currentVal;
    if (config === 'series') {
        totalR = r1 + r2;
        currentVal = voltage / totalR;
    } else {
        totalR = (r1 * r2) / (r1 + r2);
        currentVal = voltage / totalR;
    }

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_DARK', gridSize: 15, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, BABYLON.Vector3.Zero(), { radius: 25 });

        // Components
        const boardMat = new BABYLON.StandardMaterial("bm", scene);
        boardMat.diffuseColor = new BABYLON.Color3(0.05, 0.08, 0.05);
        const board = BABYLON.MeshBuilder.CreateBox("board", { width: 20, height: 0.2, depth: 12 }, scene);
        board.position.y = -0.1;
        board.material = boardMat;

        const battery = BABYLON.MeshBuilder.CreateBox("battery", { width: 2, height: 3, depth: 1.5 }, scene);
        battery.position = new BABYLON.Vector3(-7, 1.5, 0);
        
        const r1Box = BABYLON.MeshBuilder.CreateBox("r1", { width: 3, height: 1, depth: 1 }, scene);
        r1Box.position = new BABYLON.Vector3(0, 0.5, -3);
        
        const r2Box = BABYLON.MeshBuilder.CreateBox("r2", { width: 3, height: 1, depth: 1 }, scene);
        r2Box.position = new BABYLON.Vector3(0, 0.5, 3);

        const ammeter = BABYLON.MeshBuilder.CreateBox("ammeter", { width: 2, height: 2, depth: 0.5 }, scene);
        ammeter.position = new BABYLON.Vector3(6, 1, 0);

        // Wires
        const points = [
            new BABYLON.Vector3(-7, 0.5, 0), // Bat
            new BABYLON.Vector3(-7, 0.5, -3),
            new BABYLON.Vector3(-1.5, 0.5, -3), // R1 start
            new BABYLON.Vector3(1.5, 0.5, -3),  // R1 end
            new BABYLON.Vector3(6, 0.5, -3),
            new BABYLON.Vector3(6, 0.5, 0),    // Ammeter
            new BABYLON.Vector3(6, 0.5, 3),
            new BABYLON.Vector3(1.5, 0.5, 3),   // R2 end
            new BABYLON.Vector3(-1.5, 0.5, 3),  // R2 start
            new BABYLON.Vector3(-7, 0.5, 3),
            new BABYLON.Vector3(-7, 0.5, 0)     // Back to Bat
        ];

        const wire = BABYLON.MeshBuilder.CreateLines("wire", { points: points }, scene);
        wire.color = new BABYLON.Color3(0.2, 0.2, 0.2);
        wireRefs.current.push(wire);

        // Particle System for Electrons
        const ps = new BABYLON.ParticleSystem("electrons", 200, scene);
        ps.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJS_Samples/master/ParticleSystems/SoftAlpha/Circle_01.png", scene);

        const pathPoints = points;
        ps.emitter = BABYLON.Vector3.Zero();
        ps.updateFunction = (particles) => {
            for (let index = 0; index < particles.length; index++) {
                const p = particles[index];
                p.age += ps._scaledUpdateSpeed;
                if (p.age >= p.lifeTime) {
                    p.age = 0;
                    p.position.copyFrom(pathPoints[0]);
                } else {
                    const progress = (p.age / p.lifeTime) * (pathPoints.length - 1);
                    const idx = Math.floor(progress);
                    const nextIdx = (idx + 1) % pathPoints.length;
                    const segmentProgress = progress - idx;
                    BABYLON.Vector3.LerpToRef(pathPoints[idx], pathPoints[nextIdx], segmentProgress, p.position);
                }
            }
        };

        ps.minSize = 0.15;
        ps.maxSize = 0.25;
        ps.minLifeTime = 5;
        ps.maxLifeTime = 5;
        ps.emitRate = 0;
        ps.color1 = new BABYLON.Color4(0.4, 0.7, 1, 1);
        ps.start();
        particleSystemsRef.current.push(ps);

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
        if (!sceneRef.current) return;

        const currentmA = (currentVal * 1000).toFixed(1);

        onUpdate({
            voltage: voltage + " V",
            "R_total": totalR.toFixed(1) + " Ω",
            current: currentmA + " mA"
        });

        if (particleSystemsRef.current[0]) {
            particleSystemsRef.current[0].emitRate = isRunning ? currentVal * 100 : 0;
            particleSystemsRef.current[0].updateSpeed = 0.01 * (currentVal * 2);
        }

    }, [isRunning, voltage, r1, r2, config, currentVal, totalR, onUpdate]);

    const currentmA_disp = (currentVal * 1000).toFixed(1);

    const eduData = {
        formula: config === 'series' ? "R_total = R1 + R2" : "1/R_total = 1/R1 + 1/R2",
        variables: {
            "V": `${voltage} V`,
            "I": `${currentmA_disp} mA`,
            "R1": `${r1} Ω`,
            "R2": `${r2} Ω`,
            "R_total": `${totalR.toFixed(1)} Ω`
        },
        annotations: annotations
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            <EduOverlay {...eduData} />
        </div>
    );
};

export default CircuitSim;