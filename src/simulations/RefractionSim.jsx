import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const RefractionSim = ({ settings, onUpdate, isRunning, triggerReset, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const rayRef = useRef(null);
    const refractedRayRef = useRef(null);
    const [annotations, setAnnotations] = useState([]);

    const angle = Number(settings.angle) || 45;
    const n1 = Number(settings.n1) || 1.0;
    const n2 = Number(settings.n2) || 1.5;
    const angleRad = (angle * Math.PI) / 180;
    const sinTheta2 = (n1 / n2) * Math.sin(angleRad);
    const isTIR = Math.abs(sinTheta2) > 1;
    const criticalAngle = Math.asin(n2 / n1) * 180 / Math.PI;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.05, 1);

        createLabEnvironment(scene, { gridSize: 15, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(0, 2, 20), { radius: 30 });

        const airMat = new BABYLON.StandardMaterial("air", scene);
        airMat.diffuseColor = new BABYLON.Color3(0.05, 0.08, 0.12);
        airMat.alpha = 0.3;
        const air = BABYLON.MeshBuilder.CreateBox("air", { width: 20, height: 8, depth: 10 }, scene);
        air.position.y = 6;
        air.material = airMat;

        const glassMat = new BABYLON.StandardMaterial("glass", scene);
        glassMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.5);
        glassMat.alpha = 0.5;
        const glass = BABYLON.MeshBuilder.CreateBox("glass", { width: 20, height: 8, depth: 10 }, scene);
        glass.position.y = -2;
        glass.material = glassMat;

        const boundaryMat = new BABYLON.StandardMaterial("bm", scene);
        boundaryMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4);
        boundaryMat.alpha = 0.5;
        const boundary = BABYLON.MeshBuilder.CreatePlane("boundary", { width: 20, height: 10 }, scene);
        boundary.position.y = 2;
        boundary.rotation.x = Math.PI / 2;
        boundary.material = boundaryMat;

        const sourceMat = new BABYLON.StandardMaterial("sm", scene);
        sourceMat.diffuseColor = new BABYLON.Color3(1, 1, 0.8);
        sourceMat.emissiveColor = new BABYLON.Color3(1, 1, 0.5);
        const source = BABYLON.MeshBuilder.CreateCylinder("source", { diameter: 1, height: 0.5 }, scene);
        source.position = new BABYLON.Vector3(-8, 8, 0);
        source.rotation.z = Math.PI / 2;
        source.material = sourceMat;

        const normalMat = new BABYLON.StandardMaterial("nm", scene);
        normalMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        normalMat.alpha = 0.5;
        const normalLine = BABYLON.MeshBuilder.CreateLines("normal", { points: [new BABYLON.Vector3(0, 10, 0), new BABYLON.Vector3(0, -5, 0)] }, scene);
        normalLine.color = new BABYLON.Color3(0.5, 0.5, 0.5);

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
        if (!sceneRef.current) return;

        const startPoint = new BABYLON.Vector3(-8, 8, 0);
        const hitPoint = new BABYLON.Vector3(0, 2, 0);

        if (rayRef.current) rayRef.current.dispose();
        rayRef.current = BABYLON.MeshBuilder.CreateLines("incidentRay", { points: [startPoint, hitPoint] }, sceneRef.current);
        rayRef.current.color = new BABYLON.Color3(1, 1, 0.5);

        if (refractedRayRef.current) refractedRayRef.current.dispose();

        if (!isTIR) {
            const theta2 = Math.asin(sinTheta2);
            const refractedDir = new BABYLON.Vector3(Math.cos(theta2), -Math.sin(theta2), 0);
            const refractedEnd = hitPoint.add(refractedDir.scale(18));
            refractedRayRef.current = BABYLON.MeshBuilder.CreateLines("refractedRay", { points: [hitPoint, refractedEnd] }, sceneRef.current);
            refractedRayRef.current.color = new BABYLON.Color3(0, 1, 0.5);
        }

        setAnnotations([]);
        
        if (isTIR) {
            setAnnotations([{ t: "TIR", text: `Total Internal Reflection! Angle ${angle}° > critical angle ${criticalAngle.toFixed(1)}°. Light cannot escape.` }]);
        } else {
            const bendDir = n2 > n1 ? "toward the normal (slower)" : "away from the normal (faster)";
            setAnnotations([{ t: "Refraction", text: `Light bends ${bendDir}. Using Snell's Law: n₁sin(θ₁) = n₂sin(θ₂)` }]);
        }

        onUpdate({
            "angle (°)": angle + "°",
            "n1 (air)": n1.toFixed(2),
            "n2 (glass)": n2.toFixed(2),
            "refracted": isTIR ? "Total Reflection" : (n2 > n1 ? "Bent toward" : "Bent away"),
            "critical angle": criticalAngle.toFixed(1) + "°"
        });
    }, [settings.angle, settings.n1, settings.n2, triggerReset, angle, n1, n2, isTIR, sinTheta2, criticalAngle]);

    const eduData = {
        formula: "n₁sin(θ₁) = n₂sin(θ₂)",
        variables: {
            "n1": n1.toFixed(2),
            "n2": n2.toFixed(2),
            "θ1": `${angle}°`,
            "θ2": isTIR ? "N/A (TIR)" : (Math.asin(sinTheta2) * 180 / Math.PI).toFixed(1) + "°",
            "critical": `${criticalAngle.toFixed(1)}°`
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

export default RefractionSim;