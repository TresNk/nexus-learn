import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const CircularMotionSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const ballRef = useRef(null);
    const trailRef = useRef(null);

    const radius = Number(settings.radius) || 10;
    const velocity = Number(settings.velocity) || 5;
    const mass = Number(settings.mass) || 2;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_DARK', gridSize: 20 });
        createLabLighting(scene, { intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 20), { radius: 35 });

        const center = BABYLON.MeshBuilder.CreateCylinder("center", { diameter: 0.5, height: 1 }, scene);
        const centerMat = new BABYLON.StandardMaterial("centerMat", scene);
        centerMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
        center.material = centerMat;

        const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 1.5 }, scene);
        const ballMat = new BABYLON.StandardMaterial("ballMat", scene);
        ballMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);
        ball.material = ballMat;
        ballRef.current = ball;

        const line = BABYLON.MeshBuilder.CreateLines("line", {
            points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(radius, 0, 0)],
            updatable: true
        }, scene);
        line.color = new BABYLON.Color3(0.5, 0.5, 0.5);
        trailRef.current = line;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, [radius]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !ballRef.current) return;

        let angle = 0;
        const omega = velocity / radius; // Angular velocity

        const updateLoop = () => {
            if (isRunning) {
                angle += 0.016 * omega;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                ballRef.current.position.set(x, 0.75, z);

                // Update tether line
                const points = [BABYLON.Vector3.Zero(), ballRef.current.position.clone()];
                if (trailRef.current) trailRef.current.dispose();
                trailRef.current = BABYLON.MeshBuilder.CreateLines("line", { points }, scene);
                trailRef.current.color = new BABYLON.Color3(0.5, 0.5, 0.5);

                const centripetalForce = (mass * velocity * velocity) / radius;
                onUpdate({
                    centripetalForce: centripetalForce.toFixed(2) + " N",
                    angularVelocity: omega.toFixed(2) + " rad/s",
                    acceleration: (velocity * velocity / radius).toFixed(2) + " m/s²"
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, radius, velocity, mass, onUpdate]);

    const centripetalForce = (mass * velocity * velocity) / radius;

    const eduData = {
        formula: "F_c = mv²/r",
        variables: {
            "Mass": mass + " kg",
            "Velocity": velocity + " m/s",
            "Radius": radius + " m",
            "Force": centripetalForce.toFixed(2) + " N"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default CircularMotionSim;
