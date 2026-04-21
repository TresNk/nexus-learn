import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const MagneticFieldSim = ({ settings, onUpdate, isRunning, triggerReset, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const fieldLinesRef = useRef([]);
    const compassRef = useRef(null);
    const needleRef = useRef(null);
    const [annotations, setAnnotations] = useState([]);

    const separation = Number(settings.separation) || 10;
    const numLines = Number(settings.fieldLines) || 8;
    const compassX = Number(settings.compassX) || 5;
    const fieldStrength = (1 / (Math.abs(compassX + separation / 2) + 1)).toFixed(3);

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 25, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, BABYLON.Vector3.Zero(), { radius: 30 });

        const northMat = new BABYLON.StandardMaterial("nm", scene);
        northMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
        northMat.emissiveColor = new BABYLON.Color3(0.4, 0.05, 0.05);

        const southMat = new BABYLON.StandardMaterial("sm", scene);
        southMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 1);
        southMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.4);

        const magnetN = BABYLON.MeshBuilder.CreateBox("mN", { width: 2, height: 1.5, depth: 1 }, scene);
        magnetN.position = new BABYLON.Vector3(-separation / 2 - 1, 0.75, 0);
        magnetN.material = northMat;

        const magnetS = BABYLON.MeshBuilder.CreateBox("mS", { width: 2, height: 1.5, depth: 1 }, scene);
        magnetS.position = new BABYLON.Vector3(-separation / 2 + 1, 0.75, 0);
        magnetS.material = southMat;

        const compass = BABYLON.MeshBuilder.CreateCylinder("compass", { diameter: 2, height: 0.2 }, scene);
        compass.position = new BABYLON.Vector3(compassX, 0.1, 0);
        const cMat = new BABYLON.StandardMaterial("cm", scene);
        cMat.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.2);
        compass.material = cMat;
        compassRef.current = compass;

        const needle = BABYLON.MeshBuilder.CreateBox("needle", { width: 1.5, height: 0.1, depth: 0.3 }, scene);
        needle.position = new BABYLON.Vector3(compassX, 0.25, 0);
        const nMat = new BABYLON.StandardMaterial("nlm", scene);
        nMat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
        needle.material = nMat;
        needleRef.current = needle;

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

    const createFieldLines = (scene, sep, num) => {
        fieldLinesRef.current.forEach(line => line.dispose());
        fieldLinesRef.current = [];

        for (let i = 0; i < num; i++) {
            const startY = -3 + (i / (num - 1)) * 6;
            const points = [];
            
            for (let x = -15; x <= 15; x += 0.5) {
                const dist = Math.sqrt(Math.pow(x + sep / 2, 2) + Math.pow(startY, 2));
                const angle = Math.atan2(startY, x + sep / 2);
                const z = Math.sin(angle + x * 0.3) * 0.5;
                points.push(new BABYLON.Vector3(x, 0.3, z));
            }

            const line = BABYLON.MeshBuilder.CreateLines("fieldLine" + i, { points }, scene);
            line.color = new BABYLON.Color3(0.3, 0.7, 1);
            fieldLinesRef.current.push(line);
        }
    };

    useEffect(() => {
        if (!sceneRef.current) return;

        createFieldLines(sceneRef.current, separation, numLines);

        if (compassRef.current) compassRef.current.position.x = compassX;
        if (needleRef.current) {
            const angle = Math.atan2(-(compassX + separation / 2), 0.5);
            needleRef.current.rotation.y = angle;
        }

        setAnnotations([{ t: "Field", text: `Field lines show magnetic field direction. Compass needle aligns with field lines at x=${compassX}m` }]);

        onUpdate({
            separation: separation + " units",
            "field lines": numLines,
            "compass X": compassX.toFixed(1),
            "field strength": fieldStrength + " T"
        });
    }, [settings.separation, settings.fieldLines, settings.compassX, triggerReset, separation, numLines, compassX, fieldStrength]);

    const eduData = {
        formula: "B = μ₀I / 2πr",
        variables: {
            "separation": `${separation} units`,
            "compass x": `${compassX}m`,
            "field lines": numLines,
            "B": `${fieldStrength} T`
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

export default MagneticFieldSim;