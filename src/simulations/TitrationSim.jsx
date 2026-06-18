import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import EduOverlay from '../components/EduOverlay';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const TitrationSim = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 30, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 0), { radius: 25 });

        enableWebXR(scene);

        // MVP Placeholder Mesh
        const glass = new BABYLON.StandardMaterial("glass", scene);
        glass.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        glass.alpha = 0.3;

        const beaker = BABYLON.MeshBuilder.CreateCylinder("beaker", { height: 8, diameter: 6 }, scene);
        beaker.position.y = 4;
        beaker.material = glass;

        const liquid = BABYLON.MeshBuilder.CreateCylinder("liquid", { height: 7.8, diameter: 5.8 }, scene);
        liquid.position.y = 4;
        const liquidMat = new BABYLON.StandardMaterial("liquidMat", scene);
        liquidMat.diffuseColor = new BABYLON.Color3(0.8, 0.9, 1.0);
        liquid.material = liquidMat;

        const tube = BABYLON.MeshBuilder.CreateCylinder("tube", { height: 10, diameter: 1 }, scene);
        tube.position.y = 14;
        tube.material = glass;

        // Store liquid ref for loop
        const mesh = liquid;

        engine.runRenderLoop(() => {
            scene.render();
            if (isRunning) {
                const vol = settings.volume || 50;
                // Equivalence point at 50, turns pink
                const intensity = Math.max(0, (vol - 45) / 10);
                mesh.material.diffuseColor = BABYLON.Color3.Lerp(
                    new BABYLON.Color3(0.8, 0.9, 1.0),
                    new BABYLON.Color3(1.0, 0.2, 0.6),
                    Math.min(1, intensity)
                );
            }
        });

        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };
    }, [settings, isRunning, triggerReset]);

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && lazyGuide && <EduOverlay lazyGuide={lazyGuide} />}
        </div>
    );
};

export default TitrationSim;
