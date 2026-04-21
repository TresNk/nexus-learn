import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const WaveInterferenceSim = ({ settings, onUpdate, isRunning, triggerReset, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const planeRef = useRef(null);
    const time = useRef(0);
    const [annotations, setAnnotations] = useState([]);

    const frequency = Number(settings.frequency) || 1;
    const separation = Number(settings.separation) || 16;
    const amplitude = Number(settings.amplitude) || 1;
    const wavelength = 2 * Math.PI / (frequency * 2);
    const nodalLines = Math.floor(frequency * separation / 2);

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 30, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, BABYLON.Vector3.Zero(), { radius: 40 });

        const source1 = BABYLON.MeshBuilder.CreateSphere("s1", { diameter: 1.2 }, scene);
        source1.position = new BABYLON.Vector3(-separation / 2, 0.5, 0);
        const s1Mat = new BABYLON.StandardMaterial("s1m", scene);
        s1Mat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 1);
        s1Mat.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.5);
        source1.material = s1Mat;

        const source2 = BABYLON.MeshBuilder.CreateSphere("s2", { diameter: 1.2 }, scene);
        source2.position = new BABYLON.Vector3(separation / 2, 0.5, 0);
        const s2Mat = new BABYLON.StandardMaterial("s2m", scene);
        s2Mat.diffuseColor = new BABYLON.Color3(1, 0.4, 0.2);
        s2Mat.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0.1);
        source2.material = s2Mat;

        const plane = BABYLON.MeshBuilder.CreateGround("wavePlane", { width: 40, height: 40, subdivisions: 100 }, scene);
        const planeMat = new BABYLON.StandardMaterial("pm", scene);
        planeMat.emissiveColor = new BABYLON.Color3(0, 0.1, 0.15);
        planeMat.alpha = 0.95;
        plane.material = planeMat;
        planeRef.current = plane;

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

    const updateWaves = (t) => {
        if (!sceneRef.current || !planeRef.current) return;

        const positions = planeRef.current.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const colors = [];
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            
            const d1 = Math.sqrt(Math.pow(x + separation / 2, 2) + z * z);
            const d2 = Math.sqrt(Math.pow(x - separation / 2, 2) + z * z);
            
            const wave1 = Math.sin(d1 * frequency * 2 - t) * amplitude;
            const wave2 = Math.sin(d2 * frequency * 2 - t) * amplitude;
            const combined = wave1 + wave2;
            
            const normalized = (combined + 2) / 4;
            colors.push(normalized, normalized * 0.7, normalized * 0.4, 1);
        }

        planeRef.current.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
    };

    useEffect(() => {
        if (!sceneRef.current || !planeRef.current) return;
        
        time.current = 0;
        setAnnotations([]);
        updateWaves(0);

        onUpdate({
            frequency: frequency + " Hz",
            separation: separation + " units",
            "wavelength": wavelength.toFixed(2) + " m",
            "nodal lines": nodalLines
        });
    }, [settings.frequency, settings.separation, settings.amplitude, triggerReset, frequency, separation, amplitude, wavelength, nodalLines]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !planeRef.current) return;

        const animate = () => {
            if (!isRunning) return;
            time.current += 0.03;
            updateWaves(time.current);

            onUpdate({
                frequency: frequency + " Hz",
                separation: separation + " units",
                "wavelength": wavelength.toFixed(2) + " m",
                "nodal lines": nodalLines,
                time: time.current.toFixed(1) + "s"
            });

            if (time.current > 0.5 && time.current < 0.6) {
                setAnnotations([{ t: "t=" + time.current.toFixed(1) + "s", text: `Two wave sources separated by ${separation}m. Watch for interference patterns.` }]);
            }
        };

        scene.onBeforeRenderObservable.add(animate);
        return () => scene.onBeforeRenderObservable.removeCallback(animate);
    }, [isRunning, frequency, separation, amplitude, wavelength, nodalLines]);

    const eduData = {
        formula: "d sin(θ) = mλ",
        variables: {
            "d": `${separation}m (separation)`,
            "λ": `${wavelength.toFixed(2)}m (wavelength)`,
            "f": `${frequency} Hz`,
            "nodal lines": nodalLines
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

export default WaveInterferenceSim;