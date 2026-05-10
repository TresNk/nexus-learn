import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const DynamicsSim = ({ settings, onUpdate, isRunning, onImpact, triggerReset, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const boxRef = useRef(null);
    const forceArrowRef = useRef(null);
    const time = useRef(0);
    const [annotations, setAnnotations] = useState([]);
    const [liveData, setLiveData] = useState({ acceleration: 0, velocity: 0, distance: 0, time: 0 });

    const force = Number(settings.force) || 50;
    const mass = Number(settings.mass) || 10;
    const acceleration = force / mass;

    useEffect(() => {
        if (!canvasRef.current || engineRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 80, showGrid: true, showAxis: false });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(15, 0, 0), { radius: 40 });

        const track = BABYLON.MeshBuilder.CreateBox("track", { width: 300, height: 0.5, depth: 8 }, scene);
        track.position.y = -0.25;
        const tMat = new BABYLON.StandardMaterial("tm", scene);
        tMat.diffuseColor = new BABYLON.Color3(0.08, 0.1, 0.15);
        tMat.emissiveColor = new BABYLON.Color3(0.02, 0.03, 0.04);
        track.material = tMat;

        const box = BABYLON.MeshBuilder.CreateBox("box", { size: 3 }, scene);
        box.position.y = 1.5;
        const bMat = new BABYLON.StandardMaterial("bm", scene);
        bMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
        bMat.emissiveColor = new BABYLON.Color3(0.3, 0.03, 0.03);
        box.material = bMat;
        boxRef.current = box;

        const forceLabel = BABYLON.MeshBuilder.CreatePlane("forceLabel", { width: 3, height: 0.8 }, scene);
        forceLabel.position = new BABYLON.Vector3(-3, 4, 0);
        const flMat = new BABYLON.StandardMaterial("flm", scene);
        flMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
        forceLabel.material = flMat;

        engineRef.current = engine;
        sceneRef.current = scene;

        engine.runRenderLoop(() => scene.render());
        const resize = () => engine.resize();
        window.addEventListener("resize", resize);
        setTimeout(resize, 100);

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
        setAnnotations([]);
        setLiveData({ acceleration, velocity: 0, distance: 0, time: 0 });

        onUpdate({
            acceleration: acceleration.toFixed(2) + " m/s²",
            velocity: "0.0 m/s",
            distance: "0.0 m",
            time: "0.0 s"
        });
    }, [settings.force, settings.mass, triggerReset, acceleration]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !isRunning || !boxRef.current) return;

        let lastAnnTime = 0;

        const physicsStep = () => {
            if (!isRunning || boxRef.current.position.x >= 120) return;
            time.current += 0.016;

            const f = Number(settings.force) || 50;
            const m = Number(settings.mass) || 10;
            const a = f / m;

            const distance = 0.5 * a * Math.pow(time.current, 2);
            const velocity = a * time.current;

            boxRef.current.position.x = distance;
            setLiveData({ acceleration: a, velocity, distance, time: time.current });

            if (forceArrowRef.current) forceArrowRef.current.dispose();
            const arrowLen = f / 10;
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
                    { t: "0.4s", text: `F = ${f}N, m = ${m}kg. a = F/m = ${a.toFixed(2)} m/s²` },
                    { t: "0.8s", text: `Distance = ½at² = ${distance.toFixed(1)}m. Velocity = ${velocity.toFixed(1)} m/s` },
                ];
                const match = anns.find(a => parseFloat(a.t) <= time.current);
                if (match) setAnnotations(prev => [...prev.slice(-2), match]);
            }

            if (distance >= 120) {
                setAnnotations([{ t: "Done", text: `Traveled 120m in ${time.current.toFixed(1)}s. Final velocity = ${velocity.toFixed(1)} m/s` }]);
                onImpact();
            }
        };

        scene.onBeforeRenderObservable.add(physicsStep);
        return () => scene.onBeforeRenderObservable.removeCallback(physicsStep);
    }, [isRunning, settings.force, settings.mass, onImpact]);

    const eduData = {
        formula: "F = ma",
        variables: {
            "F": `${force} N (force)`,
            "m": `${mass} kg (mass)`,
            "a": `${liveData.acceleration.toFixed(2)} m/s²`,
            "v": `${liveData.velocity.toFixed(1)} m/s`,
            "d": `${liveData.distance.toFixed(1)} m`,
            "t": `${liveData.time.toFixed(1)} s`
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

export default DynamicsSim;