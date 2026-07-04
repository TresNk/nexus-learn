import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const DopplerSim = ({ settings, onUpdate, isRunning }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const sourceRef = useRef(null);
    const wavesRef = useRef([]);
    const time = useRef(0);
    const [annotations, setAnnotations] = useState([]);
    const [livePhysicsData, setLivePhysicsData] = useState(null);

    const speed = Number(settings.speed) || 10;
    const frequency = Number(settings.frequency) || 2;
    const speedOfSound = 343;
    const dopplerShift = Math.abs(frequency * speedOfSound / (speedOfSound - speed) - frequency);

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 40, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, BABYLON.Vector3.Zero(), { radius: 45 });

        const sourceMat = new BABYLON.StandardMaterial("sm", scene);
        sourceMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
        sourceMat.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1);
        const source = BABYLON.MeshBuilder.CreateSphere("source", { diameter: 2 }, scene);
        source.position = new BABYLON.Vector3(-15, 1, 0);
        source.material = sourceMat;
        sourceRef.current = source;

        const trackMat = new BABYLON.StandardMaterial("tm", scene);
        trackMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
        const track = BABYLON.MeshBuilder.CreateBox("track", { width: 40, height: 0.2, depth: 2 }, scene);
        track.position.y = -0.1;
        track.material = trackMat;

        const observerMat = new BABYLON.StandardMaterial("om", scene);
        observerMat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 1);
        observerMat.emissiveColor = new BABYLON.Color3(0.05, 0.2, 0.3);
        const observer = BABYLON.MeshBuilder.CreateCylinder("observer", { diameter: 1.5, height: 0.5 }, scene);
        observer.position = new BABYLON.Vector3(15, 0.25, 0);
        observer.material = observerMat;

        const obsLabel = BABYLON.MeshBuilder.CreatePlane("obsLabel", { width: 3, height: 0.8 }, scene);
        obsLabel.position = new BABYLON.Vector3(15, 1.2, 0);
        const olMat = new BABYLON.StandardMaterial("olm", scene);
        olMat.emissiveColor = new BABYLON.Color3(0.3, 0.6, 1);
        obsLabel.material = olMat;

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
        if (!sceneRef.current || !sourceRef.current) return;

        sourceRef.current.position.x = -15;
        time.current = 0;
        wavesRef.current.forEach(w => w.dispose());
        wavesRef.current = [];

        onUpdate({
            speed: speed + " m/s",
            frequency: frequency + " Hz",
            "doppler shift": dopplerShift.toFixed(2) + " Hz"
        });
    }, [speed, frequency, dopplerShift, onUpdate]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !isRunning || !sourceRef.current) return;

        let sourceX = -15;
        let direction = 1;
        let lastAnnTime = 0;
        const maxX = 15, minX = -15;

        const updateLoop = () => {
            if (!isRunning) return;
            time.current += 0.016;

            sourceX += direction * speed * 0.016;
            if (sourceX >= maxX || sourceX <= minX) {
                direction *= -1;
                sourceX = Math.max(minX, Math.min(maxX, sourceX));
            }
            sourceRef.current.position.x = sourceX;

            // Wave Emission logic
            if (time.current % 0.3 < 0.016) {
                const waveMat = new BABYLON.StandardMaterial("wm", scene);
                waveMat.emissiveColor = new BABYLON.Color3(1, 0.4, 0.2);
                waveMat.alpha = 0.5;
                const wave = BABYLON.MeshBuilder.CreateTorus("wave", { diameter: 2, thickness: 0.1, tessellation: 32 }, scene);
                wave.position = sourceRef.current.position.clone();
                wave.position.y = 0.5;
                wave.rotation.x = Math.PI / 2;
                wave.material = waveMat;
                wave.birth = Date.now();
                wavesRef.current.push(wave);
            }

            wavesRef.current = wavesRef.current.filter(w => {
                const age = (Date.now() - w.birth) / 1000;
                const newSize = 1 + age * 20;
                w.scaling = new BABYLON.Vector3(newSize, newSize, 1);
                w.material.alpha = Math.max(0, 0.5 - age * 0.2);
                if (w.material.alpha <= 0) { w.dispose(); return false; }
                return true;
            });

            const approaching = sourceX < 15 && direction > 0;
            const apparentFreq = approaching ? frequency * (speedOfSound / (speedOfSound - speed)) : frequency * (speedOfSound / (speedOfSound + speed));

            setLivePhysicsData({ freq: apparentFreq, pos: sourceX, status: approaching ? "Approaching" : "Receding" });

            onUpdate({
                speed: speed + " m/s",
                frequency: frequency + " Hz",
                "apparent freq": Math.abs(apparentFreq).toFixed(1) + " Hz",
                state: approaching ? "Approaching" : "Receding"
            });

            if (time.current - lastAnnTime > 0.5) {
                lastAnnTime = time.current;
                const approachingText = approaching 
                    ? `Waves compress → higher pitch`
                    : `Waves stretch → lower pitch`;
                setAnnotations(prev => [...prev.slice(-1), { t: "t=" + time.current.toFixed(1) + "s", text: approachingText }]);
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, speed, frequency, speedOfSound, onUpdate]);

    const displayFreq = livePhysicsData ? livePhysicsData.freq : frequency;

    const eduData = {
        formula: "f' = f(v / (v ± vs))",
        variables: {
            "f": `${frequency} Hz`,
            "v": `${speedOfSound} m/s`,
            "vs": `${speed} m/s`,
            "f'": `${Math.abs(displayFreq).toFixed(1)} Hz`
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

export default DopplerSim;