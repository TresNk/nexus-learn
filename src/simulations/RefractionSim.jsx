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
    const [annotations] = useState([]);

    const angle = Number(settings.angle) || 45;
    const n1 = Number(settings.n1) || 1.0;
    const n2 = Number(settings.n2) || 1.5;
    const angleRad = (angle * Math.PI) / 180;
    const sinTheta2 = (n1 / n2) * Math.sin(angleRad);
    const isTIR = Math.abs(sinTheta2) > 1;
    const criticalAngle = n1 > n2 ? Math.asin(n2 / n1) * 180 / Math.PI : null;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_DARK', gridSize: 15, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(0, 2, 20), { radius: 30 });

        const glassMat = new BABYLON.StandardMaterial("glass", scene);
        glassMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.5);
        glassMat.alpha = 0.5;
        const glass = BABYLON.MeshBuilder.CreateBox("glass", { width: 20, height: 8, depth: 10 }, scene);
        glass.position.y = -2;
        glass.material = glassMat;

        const normalLine = BABYLON.MeshBuilder.CreateLines("normal", { points: [new BABYLON.Vector3(0, 10, 0), new BABYLON.Vector3(0, -5, 0)] }, scene);
        normalLine.color = new BABYLON.Color3(0.5, 0.5, 0.5);

        engineRef.current = engine;
        sceneRef.current = scene;

        engine.runRenderLoop(() => scene.render());
        return () => engine.dispose();
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        let progress = 0;
        const startPoint = new BABYLON.Vector3(-Math.sin(angleRad) * 10, Math.cos(angleRad) * 10 + 2, 0);
        const hitPoint = new BABYLON.Vector3(0, 2, 0);

        if (rayRef.current) rayRef.current.dispose();
        if (refractedRayRef.current) refractedRayRef.current.dispose();

        const animateRay = () => {
            if (!isRunning) {
                progress = 0;
                return;
            }

            progress += 0.02;
            if (progress > 1.5) progress = 0;

            const currentRayPoints = [startPoint, BABYLON.Vector3.Lerp(startPoint, hitPoint, Math.min(progress, 1))];
            if (rayRef.current) rayRef.current.dispose();
            rayRef.current = BABYLON.MeshBuilder.CreateLines("incident", { points: currentRayPoints }, scene);
            rayRef.current.color = new BABYLON.Color3(1, 1, 0.5);

            if (progress > 1) {
                const refractedProgress = progress - 1;
                let endPoint;
                if (isTIR) {
                    const reflectedDir = new BABYLON.Vector3(Math.sin(angleRad), Math.cos(angleRad), 0);
                    endPoint = hitPoint.add(reflectedDir.scale(10));
                } else {
                    const theta2 = Math.asin(sinTheta2);
                    const refractedDir = new BABYLON.Vector3(Math.sin(theta2), -Math.cos(theta2), 0);
                    endPoint = hitPoint.add(refractedDir.scale(10));
                }

                const currentRefractedPoints = [hitPoint, BABYLON.Vector3.Lerp(hitPoint, endPoint, Math.min(refractedProgress * 2, 1))];
                if (refractedRayRef.current) refractedRayRef.current.dispose();
                refractedRayRef.current = BABYLON.MeshBuilder.CreateLines("refracted", { points: currentRefractedPoints }, scene);
                refractedRayRef.current.color = isTIR ? new BABYLON.Color3(1, 0.2, 0.2) : new BABYLON.Color3(0.5, 1, 0.5);
            }
        };

        scene.onBeforeRenderObservable.add(animateRay);

        return () => scene.onBeforeRenderObservable.removeCallback(animateRay);
    }, [isRunning, triggerReset, angleRad, isTIR, sinTheta2]);

    useEffect(() => {
        const t2 = isTIR ? 'TIR' : (Math.asin(sinTheta2) * 180 / Math.PI).toFixed(1) + "°";
        onUpdate({ "θ1": angle + "°", "θ2": t2, status: isTIR ? 'Reflected' : 'Refracted' });
    }, [angle, isTIR, sinTheta2, onUpdate]);

    const t2_display = isTIR ? 'TIR' : (Math.asin(sinTheta2) * 180 / Math.PI).toFixed(1) + "°";

    const eduData = {
        formula: "n₁sin(θ₁) = n₂sin(θ₂)",
        variables: {
            "n1": n1.toFixed(2),
            "n2": n2.toFixed(2),
            "θ1": `${angle}°`,
            "θ2": t2_display,
            "Critical": criticalAngle ? `${criticalAngle.toFixed(1)}°` : "N/A"
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
