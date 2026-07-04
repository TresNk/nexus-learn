import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const MagneticFieldSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const fieldLinesRef = useRef([]);
    const compassRef = useRef(null);
    const needleRef = useRef(null);
    const [livePhysicsData, setLivePhysicsData] = useState(null);

    const separation = Number(settings.separation) || 10;
    const numLines = Number(settings.fieldLines) || 12;
    const compassX = Number(settings.compassX) || 5;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_WHITE', gridSize: 25, showGrid: true });
        createLabLighting(scene, { preset: 'LAB_WHITE', intensity: 1.0 });
        createLabCamera(scene, BABYLON.Vector3.Zero(), { radius: 30 });

        const northMat = new BABYLON.StandardMaterial("nm", scene);
        northMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
        const magnet = BABYLON.MeshBuilder.CreateBox("magnet", { width: 4, height: 1.5, depth: 1.5 }, scene);
        magnet.position = new BABYLON.Vector3(-separation / 2, 0.75, 0);
        magnet.material = northMat;

        const compass = BABYLON.MeshBuilder.CreateCylinder("compass", { diameter: 2.5, height: 0.4 }, scene);
        compass.position = new BABYLON.Vector3(compassX, 0.2, 0);
        compassRef.current = compass;

        const needle = BABYLON.MeshBuilder.CreateBox("needle", { width: 1.8, height: 0.1, depth: 0.4 }, scene);
        needle.position = new BABYLON.Vector3(compassX, 0.5, 0);
        const nMat = new BABYLON.StandardMaterial("nMat", scene);
        nMat.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
        needle.material = nMat;
        needleRef.current = needle;

        fieldLinesRef.current.forEach(l => l.dispose());
        fieldLinesRef.current = [];

        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const points = [];
            for (let t = 0; t <= 1; t += 0.05) {
                const r = 2 + t * 15;
                const x = -separation / 2 + Math.cos(angle) * r;
                const z = Math.sin(angle) * r;
                points.push(new BABYLON.Vector3(x, 0.1, z));
            }
            const line = BABYLON.MeshBuilder.CreateDashedLines("fieldLine", { points: points, dashSize: 1, gapSize: 0.5 }, scene);
            line.color = new BABYLON.Color3(0.3, 0.5, 1);
            fieldLinesRef.current.push(line);
        }

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, [separation, numLines, compassX]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !needleRef.current) return;

        const animateCompass = () => {
            if (!isRunning) return;

            const dx = compassX - (-separation / 2);
            const dz = 0;
            const targetAngle = -Math.atan2(dz, dx);

            needleRef.current.rotation.y = BABYLON.Scalar.Lerp(needleRef.current.rotation.y, targetAngle, 0.05);

            const dist = Math.sqrt(dx*dx + dz*dz);
            const bStrength = (100 / (dist * dist)).toFixed(3);

            setLivePhysicsData({ bField: bStrength, alignment: (needleRef.current.rotation.y * 180 / Math.PI).toFixed(1) });
            onUpdate({ "B Strength": bStrength + " μT", "Needle Angle": (needleRef.current.rotation.y * 180 / Math.PI).toFixed(1) + "°" });
        };

        scene.onBeforeRenderObservable.add(animateCompass);
        return () => scene.onBeforeRenderObservable.removeCallback(animateCompass);
    }, [isRunning, separation, compassX, onUpdate]);

    const displayB = livePhysicsData ? livePhysicsData.bField : "0.000";
    const displayA = livePhysicsData ? livePhysicsData.alignment : "0.0";

    const eduData = {
        formula: "B = μ₀I / 2πr",
        variables: {
            "Distance (r)": Math.abs(compassX + separation / 2).toFixed(1) + " m",
            "B Field": displayB + " μT",
            "Needle θ": displayA + "°"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default MagneticFieldSim;