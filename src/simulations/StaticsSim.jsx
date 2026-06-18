import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const StaticsSim = ({ settings, isRunning, triggerReset }) => {
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
        const mesh = BABYLON.MeshBuilder.CreateTorus("placeholder", { diameter: 4, thickness: 1 }, scene);
        mesh.position.y = 3;

        const mat = new BABYLON.StandardMaterial("mat", scene);
        mat.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
        mesh.material = mat;

        engine.runRenderLoop(() => {
            scene.render();
            if (isRunning) {
                mesh.rotation.y += (settings.speed || 1) * 0.02;
                mesh.rotation.x += (settings.speed || 1) * 0.01;
            }
        });

        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };
    }, [settings, isRunning, triggerReset]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />;
};

export default StaticsSim;
