import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const GenericSimulation = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 30, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 0), { radius: 20 });

        const objectMat = new BABYLON.StandardMaterial("objMat", scene);
        objectMat.diffuseColor = settings.color
            ? BABYLON.Color3.FromHexString(settings.color)
            : new BABYLON.Color3(0.2, 0.5, 1);

        let mesh;
        if (settings.shape === 'box') {
            mesh = BABYLON.MeshBuilder.CreateBox("obj", { size: settings.size || 2 }, scene);
        } else {
            mesh = BABYLON.MeshBuilder.CreateSphere("obj", { diameter: settings.size || 2 }, scene);
        }

        mesh.position.y = (settings.size || 2) / 2;
        mesh.material = objectMat;

        enableWebXR(scene);

        engine.runRenderLoop(() => {
            scene.render();
            if (isRunning) {
                // simple rotation as dynamic feedback
                mesh.rotation.y += (settings.speed || 1) * 0.01;
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

export default GenericSimulation;