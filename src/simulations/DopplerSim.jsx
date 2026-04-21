import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const DopplerSim = ({ settings, onUpdate, isRunning, triggerReset, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const sourceRef = useRef(null);
    const wavesRef = useRef([]);
    const time = useRef(0);
    const [annotations, setAnnotations] = useState([]);

    const speed = Number(settings.speed) || 10;
    const frequency = Number(settings.frequency) || 2;
    const wavelength = speed / frequency;
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
        setTimeout(resize, 100);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };
    }, []);

    useEffect(() => {
        if (!sceneRef.current || !sourceRef.current) return;

        sourceRef.current.position.x = -15;
        time.current = 0;
        setAnnotations([]);
        wavesRef.current.forEach(w => w.dispose());
        wavesRef.current = [];

        onUpdate({
            speed: speed + " m/s",
            frequency: frequency + " Hz",
            wavelength: wavelength.toFixed(1) + " m",
            "doppler shift": dopplerShift.toFixed(2) + " Hz"
        });
    }, [settings.speed, settings.frequency, triggerReset, speed, frequency, wavelength, dopplerShift]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !isRunning || !sourceRef.current) return;

        let sourceX = -15;
        let direction = 1;
        let lastAnnTime = 0;
        const maxX = 15, minX = -15;

        wavesRef.current.forEach(w => w.dispose());
        wavesRef.current = [];

        const updateLoop = () => {
            if (!isRunning) return;
            time.current += 0.016;

            sourceX += direction * speed * 0.016;
            if (sourceX >= maxX || sourceX <= minX) {
                direction *= -1;
                sourceX = Math.max(minX, Math.min(maxX, sourceX));
            }
            sourceRef.current.position.x = sourceX;

            if (time.current > 0.3) {
                time.current = 0;
                const waveMat = new BABYLON.StandardMaterial("wm" + Date.now(), scene);
                waveMat.emissiveColor = new BABYLON.Color3(1, 0.4, 0.2);
                waveMat.alpha = 0.5;
                const wave = BABYLON.MeshBuilder.CreateTorus("wave", { diameter: 2, thickness: 0.15, tessellation: 32 }, scene);
                wave.position = sourceRef.current.position.clone();
                wave.position.y = 0.5;
                wave.rotation.x = Math.PI / 2;
                wave.material = waveMat;
                wave.birth = Date.now();
                wavesRef.current.push(wave);
            }

            wavesRef.current = wavesRef.current.filter(w => {
                const age = (Date.now() - w.birth) / 1000;
                const newDiameter = 2 + age * 15;
                w.scaling = new BABYLON.Vector3(newDiameter / 2, newDiameter / 2, 1);
                w.material.alpha = Math.max(0, 0.5 - age * 0.04);
                if (w.material.alpha <= 0) { w.dispose(); return false; }
                return true;
            });

            const approaching = sourceX < 15 && direction > 0;
            const apparentFreq = approaching ? frequency * (speedOfSound / (speedOfSound - speed)) : frequency * (speedOfSound / (speedOfSound + speed));

            onUpdate({
                speed: speed + " m/s",
                frequency: frequency + " Hz",
                position: sourceX.toFixed(1) + " m",
                "apparent freq": Math.abs(apparentFreq).toFixed(1) + " Hz",
                state: approaching ? "Approaching" : "Receding"
            });

            if (time.current - lastAnnTime > 0.4) {
                lastAnnTime = time.current;
                const approachingText = approaching 
                    ? `Moving toward observer! Waves compress → higher frequency: ${apparentFreq.toFixed(1)} Hz`
                    : `Moving away! Waves stretch → lower frequency: ${apparentFreq.toFixed(1)} Hz`;
                setAnnotations([{ t: "t=" + time.current.toFixed(1) + "s", text: approachingText }]);
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, speed, frequency]);

    const eduData = {
        formula: "f' = f(v / (v ± vs))",
        variables: {
            "f": `${frequency} Hz (source)`,
            "v": `${speedOfSound} m/s (sound)`,
            "vs": `${speed} m/s (source speed)`,
            "Δf": `${dopplerShift.toFixed(2)} Hz`
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

export default DopplerSim;