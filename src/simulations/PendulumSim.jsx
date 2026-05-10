import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const PendulumSim = ({ settings, onUpdate, isRunning, triggerReset, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const bobRef = useRef(null);
    const rodRef = useRef(null);
    const time = useRef(0);
    const thetaRef = useRef(0);
    const velocityArrowRef = useRef(null);
    const [annotations, setAnnotations] = useState([]);
    const [liveData, setLiveData] = useState({ theta: 0, velocity: 0, time: 0 });

    const length = Number(settings.length) || 8;
    const initialAngle = (Number(settings.angle) || 45) * Math.PI / 180;
    const g = 9.81;
    const omega = Math.sqrt(g / length);
    const period = 2 * Math.PI * Math.sqrt(length / g);
    const maxTheta = initialAngle * Math.exp(-omega * 0.5);

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 25, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, BABYLON.Vector3.Zero(), { radius: 25 });

        const pivotMat = new BABYLON.StandardMaterial("pm", scene);
        pivotMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.5);
        const pivot = BABYLON.MeshBuilder.CreateBox("pivot", { width: 3, height: 0.5, depth: 1 }, scene);
        pivot.position.y = 10;
        pivot.material = pivotMat;

        const rod = BABYLON.MeshBuilder.CreateCylinder("rod", { diameter: 0.15, height: length }, scene);
        rod.position.y = 10 - length / 2;
        const rodMat = new BABYLON.StandardMaterial("rm", scene);
        rodMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.6);
        rod.material = rodMat;
        rodRef.current = rod;

        const bob = BABYLON.MeshBuilder.CreateSphere("bob", { diameter: 2 }, scene);
        const bobMat = new BABYLON.StandardMaterial("bm", scene);
        bobMat.diffuseColor = new BABYLON.Color3(1, 0.4, 0.2);
        bobMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.05);
        bob.material = bobMat;
        bobRef.current = bob;

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
        if (!sceneRef.current || !bobRef.current || !rodRef.current) return;

        thetaRef.current = initialAngle;
        time.current = 0;
        setAnnotations([]);
        setLiveData({ theta: initialAngle, velocity: 0, time: 0 });

        const rodLength = length;
        rodRef.current.scaling.y = rodLength / 8;
        rodRef.current.position.y = 10 - rodLength / 2;

        const x = rodLength * Math.sin(initialAngle);
        const y = 10 - rodLength * Math.cos(initialAngle);
        bobRef.current.position = new BABYLON.Vector3(x, y, 0);

        onUpdate({
            period: period.toFixed(2) + " s",
            frequency: (1 / period).toFixed(2) + " Hz",
            theta: (thetaRef.current * 180 / Math.PI).toFixed(1) + "°",
            length: length + " m"
        });
    }, [settings.length, settings.angle, triggerReset, initialAngle, length, period]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !isRunning || !bobRef.current || !rodRef.current) return;

        let lastAnnTime = 0;
        const damping = 0.01;

        const physicsStep = () => {
            if (!isRunning) return;
            time.current += 0.016;

            thetaRef.current = initialAngle * Math.cos(omega * time.current) * Math.exp(-damping * time.current);

            const x = length * Math.sin(thetaRef.current);
            const y = 10 - length * Math.cos(thetaRef.current);

            bobRef.current.position.x = x;
            bobRef.current.position.y = y;

            rodRef.current.rotation.z = thetaRef.current;

            if (velocityArrowRef.current) velocityArrowRef.current.dispose();
            const velocity = length * omega * Math.abs(Math.sin(omega * time.current)) * Math.exp(-damping * time.current);
            setLiveData({ theta: thetaRef.current, velocity, time: time.current });

            const arrowLen = velocity / 3;
            const tangentAngle = thetaRef.current + Math.PI / 2;
            const arrowEnd = bobRef.current.position.add(new BABYLON.Vector3(
                Math.cos(tangentAngle) * arrowLen,
                Math.sin(tangentAngle) * arrowLen,
                0
            ));
            velocityArrowRef.current = BABYLON.MeshBuilder.CreateLines("velArrow", {
                points: [bobRef.current.position, arrowEnd]
            }, scene);
            velocityArrowRef.current.color = new BABYLON.Color3(0.2, 1, 0.4);

            const currentThetaDeg = (thetaRef.current * 180 / Math.PI).toFixed(1);
            onUpdate({
                period: period.toFixed(2) + " s",
                frequency: (1 / period).toFixed(2) + " Hz",
                theta: currentThetaDeg + "°",
                velocity: velocity.toFixed(2) + " m/s"
            });

            if (time.current - lastAnnTime > 0.5 && time.current < 3) {
                lastAnnTime = time.current;
                const annotations = [
                    { t: "t=0.5s", text: `Starting from ${settings.angle}° with angular velocity ${omega.toFixed(2)} rad/s` },
                    { t: "t=1.0s", text: `Maximum speed at lowest point. θ = ${currentThetaDeg}°` },
                    { t: "t=1.5s", text: `Damping reducing amplitude. Energy = ½mω²A²` },
                ];
                const match = annotations.find(a => parseFloat(a.t.split('=')[1]) <= time.current);
                if (match) setAnnotations(prev => [...prev.slice(-2), match]);
            }

            if (thetaRef.current < 0.01 && time.current > 2) {
                setAnnotations([{ t: "Done", text: `Oscillation complete. Period = ${period.toFixed(2)}s` }]);
            }
        };

        scene.onBeforeRenderObservable.add(physicsStep);
        return () => scene.onBeforeRenderObservable.removeCallback(physicsStep);
    }, [isRunning, length, omega, initialAngle, period, settings.angle]);

    const eduData = {
        formula: "T = 2π√(L/g)",
        variables: {
            "L": `${length}m (length)`,
            "g": "9.81 m/s²",
            "T": `${period.toFixed(2)}s (period)`,
            "θ": `${(liveData.theta * 180 / Math.PI).toFixed(1)}°`,
            "v": `${liveData.velocity.toFixed(2)} m/s`,
            "t": `${liveData.time.toFixed(2)}s`
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

export default PendulumSim;