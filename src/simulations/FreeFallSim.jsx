import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';
import { triggerExplosion, shakeCamera } from '../utils/vfx';
import { playImpactSound } from '../utils/audio';
import EduOverlay from '../components/EduOverlay';

const FreeFallSim = ({ settings, onUpdate, isRunning, onImpact, triggerReset, eduMode = true, lazyGuide }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const ballRef = useRef(null);
    const time = useRef(0);
    const [annotations, setAnnotations] = useState([]);

    const height = Number(settings.height) || 30;
    const g = 9.81;
    const fallTime = Math.sqrt(2 * height / g);
    const terminalVelocity = settings.drag ? 20 : null;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 30, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        const camera = createLabCamera(scene, new BABYLON.Vector3(0, 15, 25), { radius: 45 });

        const rulerMat = new BABYLON.StandardMaterial("rm", scene);
        rulerMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4);
        
        for (let i = 0; i <= 40; i += 5) {
            const marker = BABYLON.MeshBuilder.CreateBox("marker" + i, { width: 1, height: 0.1, depth: 0.5 }, scene);
            marker.position = new BABYLON.Vector3(-10, i, 0);
            marker.material = rulerMat;
            
            const label = BABYLON.MeshBuilder.CreatePlane("label" + i, { width: 2, height: 0.5 }, scene);
            label.position = new BABYLON.Vector3(-12, i, 0);
            label.rotation.y = Math.PI;
            const labelMat = new BABYLON.StandardMaterial("lm", scene);
            labelMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            label.material = labelMat;
        }

    enableWebXR(scene);

        const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 1.5 }, scene);
        const ballMat = new BABYLON.StandardMaterial("bm", scene);
        ballMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
        ballMat.emissiveColor = new BABYLON.Color3(0.4, 0.1, 0.1);
        ball.material = ballMat;
        ballRef.current = ball;

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

    useEffect(() => {
        if (!sceneRef.current || !ballRef.current) return;

        const startHeight = Number(settings.height) || 30;
        ballRef.current.position = new BABYLON.Vector3(0, startHeight, 0);
        time.current = 0;
        setAnnotations([]);

        onUpdate({
            height: startHeight.toFixed(1) + " m",
            velocity: "0.0 m/s",
            time: "0.0 s",
            drag: settings.drag ? "On" : "Off"
        });
    }, [settings.height, settings.drag, triggerReset]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !isRunning || !ballRef.current) return;

        let velocity = 0;
        let position = Number(settings.height) || 30;
        const mass = Number(settings.mass) || 1;
        const dragCoeff = settings.drag ? 0.1 : 0;
        let lastAnnTime = 0;

        const physicsStep = () => {
            if (!isRunning || position <= 0.75) return;
            
            time.current += 0.016;
            const dt = 0.016;

            const dragForce = dragCoeff * velocity * velocity;
            const acceleration = g - (dragForce / mass) * (velocity > 0 ? 1 : -1);
            
            velocity += acceleration * dt;
            position -= velocity * dt;

            ballRef.current.position.y = Math.max(0.75, position);

            const currentVel = Math.abs(velocity);
            onUpdate({
                height: position.toFixed(1) + " m",
                velocity: currentVel.toFixed(1) + " m/s",
                time: time.current.toFixed(2) + " s",
                drag: settings.drag ? "On" : "Off"
            });

            if (time.current - lastAnnTime > 0.3) {
                lastAnnTime = time.current;
                const anns = [
                    { t: "0.3s", text: `Falling! Velocity = ${velocity.toFixed(1)} m/s. Acceleration = ${acceleration.toFixed(1)} m/s²` },
                    { t: "0.6s", text: `Height = ${position.toFixed(1)}m. Distance fallen = ${(Number(settings.height) - position).toFixed(1)}m` },
                    { t: "0.9s", text: `v = gt (ignoring drag): ${(g * time.current).toFixed(1)} m/s` },
                ];
                const match = anns.find(a => parseFloat(a.t) <= time.current);
                if (match) setAnnotations(prev => [...prev.slice(-2), match]);
            }

            if (position <= 0.75) {
                ballRef.current.position.y = 0.75;
                setAnnotations([{ t: "Done", text: `Landed! Fall time = ${time.current.toFixed(2)}s (theoretical: ${fallTime.toFixed(2)}s)` }]);
                triggerExplosion(scene, ballRef.current.position.clone());
                shakeCamera(camera, scene);
                playImpactSound();
                onImpact();
            }
        };

        scene.onBeforeRenderObservable.add(physicsStep);
        return () => scene.onBeforeRenderObservable.removeCallback(physicsStep);
    }, [isRunning, settings.drag, settings.mass, onImpact, g, fallTime, settings.height]);

    const eduData = {
        formula: "h = h₀ - ½gt²",
        variables: {
            "h₀": `${height}m (initial height)`,
            "g": "9.81 m/s²",
            "t": `${time.current.toFixed(2)}s`,
            "fall time": `${fallTime.toFixed(2)}s`
        },
        annotations: annotations,
        lazyGuide
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default FreeFallSim;