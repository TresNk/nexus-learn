import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const SpringSim = ({ settings, onUpdate, isRunning, triggerReset, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const massRef = useRef(null);
    const springRef = useRef(null);
    const time = useRef(0);
    const [annotations, setAnnotations] = useState([]);

    const k = Number(settings.k) || 20;
    const mass = Number(settings.mass) || 2;
    const displacement = Number(settings.displacement) || 3;
    const omega = Math.sqrt(k / mass);
    const period = 2 * Math.PI / omega;
    const equilibriumY = 8;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 20, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(0, 8, 20), { radius: 25 });

        const ceilingMat = new BABYLON.StandardMaterial("cm", scene);
        ceilingMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4);
        const ceiling = BABYLON.MeshBuilder.CreateBox("ceiling", { width: 6, height: 0.5, depth: 4 }, scene);
        ceiling.position.y = 14;
        ceiling.material = ceilingMat;

        const anchor = BABYLON.MeshBuilder.CreateCylinder("anchor", { diameter: 0.4, height: 1 }, scene);
        anchor.position.y = 13.5;
        anchor.material = anchorMat(scene);

        const mass = BABYLON.MeshBuilder.CreateBox("mass", { width: 2.5, height: 2.5, depth: 2.5 }, scene);
        const massMat = new BABYLON.StandardMaterial("mm", scene);
        massMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
        massMat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.3);
        mass.material = massMat;
        massRef.current = mass;

        const rulerMat = new BABYLON.StandardMaterial("rm", scene);
        rulerMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4);
        for (let i = 0; i <= 15; i += 1) {
            const tick = BABYLON.MeshBuilder.CreateBox("tick" + i, { width: 0.5, height: 0.05, depth: 0.1 }, scene);
            tick.position = new BABYLON.Vector3(5, 14 - i, 0);
            tick.material = rulerMat;
        }

        engineRef.current = engine;
        sceneRef.current = scene;

        engine.runRenderLoop(() => scene.render());
        const resize = () => engine.resize();
        window.addEventListener("resize", resize);
        setTimeout(resize, 100);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };
    }, []);

    const anchorMat = (scene) => {
        const mat = new BABYLON.StandardMaterial("am", scene);
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.6);
        return mat;
    };

    const createSpring = (scene, topY, bottomY, coils = 15) => {
        const points = [];
        for (let i = 0; i <= coils * 4; i++) {
            const t = i / (coils * 4);
            const y = topY + (bottomY - topY) * t;
            const x = Math.sin(t * Math.PI * coils * 2) * 0.3;
            points.push(new BABYLON.Vector3(x, y, 0));
        }
        return BABYLON.MeshBuilder.CreateTube("spring", { path: points, radius: 0.08, tessellation: 8 }, scene);
    };

    useEffect(() => {
        if (!sceneRef.current || !massRef.current) return;

        const targetY = equilibriumY - displacement;
        massRef.current.position.y = targetY;

        if (springRef.current) springRef.current.dispose();
        springRef.current = createSpring(sceneRef.current, 13.5, targetY + 1.25);

        time.current = 0;
        setAnnotations([]);

        const springForce = k * displacement;
        onUpdate({
            k: k + " N/m",
            mass: mass + " kg",
            displacement: displacement.toFixed(1) + " m",
            "spring force": springForce.toFixed(1) + " N",
            period: period.toFixed(2) + " s"
        });
    }, [settings.k, settings.mass, settings.displacement, triggerReset, k, mass, displacement, equilibriumY, period]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !isRunning || !massRef.current) return;

        let position = -displacement;
        let velocity = 0;
        let lastAnnTime = 0;

        const physicsStep = () => {
            if (!isRunning) return;
            time.current += 0.016;

            const acceleration = -(k / mass) * position;
            velocity += acceleration * 0.016;
            position += velocity * 0.016;

            const newY = equilibriumY + position;
            massRef.current.position.y = newY;

            if (springRef.current) {
                springRef.current.dispose();
                springRef.current = createSpring(scene, 13.5, newY + 1.25);
            }

            const springForce = Math.abs(k * position);
            const totalEnergy = 0.5 * k * position * position + 0.5 * mass * velocity * velocity;

            onUpdate({
                k: k + " N/m",
                mass: mass + " kg",
                displacement: Math.abs(position).toFixed(2) + " m",
                "spring force": springForce.toFixed(1) + " N",
                velocity: Math.abs(velocity).toFixed(2) + " m/s",
                energy: totalEnergy.toFixed(1) + " J"
            });

            if (time.current - lastAnnTime > 0.4) {
                lastAnnTime = time.current;
                const anns = [
                    { t: "0.4s", text: `Maximum extension! Spring force = ${springForce.toFixed(1)}N. Velocity = 0` },
                    { t: "0.8s", text: `Accelerating back toward equilibrium. v = ${Math.abs(velocity).toFixed(1)} m/s` },
                ];
                const match = anns.find(a => parseFloat(a.t) <= time.current);
                if (match) setAnnotations(prev => [...prev.slice(-2), match]);
            }
        };

        scene.onBeforeRenderObservable.add(physicsStep);
        return () => scene.onBeforeRenderObservable.removeCallback(physicsStep);
    }, [isRunning, k, mass, displacement, equilibriumY]);

    const eduData = {
        formula: "F = -kx",
        variables: {
            "k": `${k} N/m`,
            "x": `${displacement}m (displacement)`,
            "ω": `${omega.toFixed(2)} rad/s`,
            "T": `${period.toFixed(2)}s`
        },
        annotations: annotations
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default SpringSim;