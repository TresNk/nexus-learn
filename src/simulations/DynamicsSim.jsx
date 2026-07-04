import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const DynamicsSim = ({ settings, onUpdate, isRunning, onImpact }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const boxRef = useRef(null);
    const forceArrowRef = useRef(null);
    const time = useRef(0);
    const [annotations, setAnnotations] = useState([]);
    const [livePhysicsData, setLivePhysicsData] = useState(null);

    const force = Number(settings.force) || 50;
    const mass = Number(settings.mass) || 10;
    const acceleration = force / mass;

    useEffect(() => {
        if (!canvasRef.current || engineRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 80, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(15, 0, 0), { radius: 40 });

        const track = BABYLON.MeshBuilder.CreateBox("track", { width: 300, height: 0.5, depth: 8 }, scene);
        track.position.y = -0.25;
        const tMat = new BABYLON.StandardMaterial("tm", scene);
        tMat.diffuseColor = new BABYLON.Color3(0.08, 0.1, 0.15);
        track.material = tMat;

        const box = BABYLON.MeshBuilder.CreateBox("box", { size: 3 }, scene);
        box.position.y = 1.5;
        const bMat = new BABYLON.StandardMaterial("bm", scene);
        bMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
        box.material = bMat;
        boxRef.current = box;

        engineRef.current = engine;
        sceneRef.current = scene;

        engine.runRenderLoop(() => scene.render());
        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
            engineRef.current = null;
        };
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !boxRef.current) return;

        boxRef.current.position.x = 0;
        time.current = 0;

        onUpdate({
            acceleration: acceleration.toFixed(2) + " m/s²",
            velocity: "0.0 m/s",
            distance: "0.0 m",
            time: "0.0 s"
        });
    }, [acceleration, onUpdate]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !isRunning || !boxRef.current) return;

        let lastAnnTime = 0;

        const physicsStep = () => {
            if (!isRunning || boxRef.current.position.x >= 120) return;
            time.current += 0.016;

            const a = force / mass;
            const distance = 0.5 * a * Math.pow(time.current, 2);
            const velocity = a * time.current;

            boxRef.current.position.x = distance;
            setLivePhysicsData({ acceleration: a, velocity, distance, time: time.current });

            if (forceArrowRef.current) forceArrowRef.current.dispose();
            const arrowLen = force / 10;
            forceArrowRef.current = BABYLON.MeshBuilder.CreateLines("forceArrow", {
                points: [new BABYLON.Vector3(boxRef.current.position.x - 2, 3, 0), new BABYLON.Vector3(boxRef.current.position.x - 2 - arrowLen, 3, 0)]
            }, scene);
            forceArrowRef.current.color = new BABYLON.Color3(1, 0.5, 0);

            onUpdate({
                acceleration: a.toFixed(2) + " m/s²",
                velocity: velocity.toFixed(1) + " m/s",
                distance: distance.toFixed(1) + " m",
                time: time.current.toFixed(1) + " s"
            });

            if (time.current - lastAnnTime > 0.4) {
                lastAnnTime = time.current;
                const anns = [
                    { t: "0.4s", text: `a = F/m = ${a.toFixed(2)} m/s²` },
                    { t: "0.8s", text: `v = at = ${velocity.toFixed(1)} m/s` },
                ];
                const match = anns.find(an => parseFloat(an.t) <= time.current);
                if (match) setAnnotations(prev => [...prev.slice(-2), match]);
            }

            if (distance >= 120) {
                onImpact();
            }
        };

        scene.onBeforeRenderObservable.add(physicsStep);
        return () => scene.onBeforeRenderObservable.removeCallback(physicsStep);
    }, [isRunning, force, mass, onImpact, onUpdate]);

    const dispA = livePhysicsData ? livePhysicsData.acceleration : acceleration;
    const dispV = livePhysicsData ? livePhysicsData.velocity : 0;
    const dispD = livePhysicsData ? livePhysicsData.distance : 0;
    const dispT = livePhysicsData ? livePhysicsData.time : 0;

    const eduData = {
        formula: "F = ma",
        variables: {
            "F": `${force} N`,
            "m": `${mass} kg`,
            "a": `${dispA.toFixed(2)} m/s²`,
            "v": `${dispV.toFixed(1)} m/s`,
            "d": `${dispD.toFixed(1)} m`,
            "t": `${dispT.toFixed(1)} s`
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

export default DynamicsSim;