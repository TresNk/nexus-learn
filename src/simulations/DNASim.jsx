import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import EduOverlay from '../components/EduOverlay';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const DNASim = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true }) => {
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
        const mesh = new BABYLON.TransformNode("dna", scene);
        const length = settings.length || 20;
        for (let i = 0; i < length; i++) {
            const angle = i * 0.4;
            const y = (i - length/2) * 1.5;

            const p1 = BABYLON.MeshBuilder.CreateSphere("p1", { diameter: 1 }, scene);
            p1.position = new BABYLON.Vector3(Math.cos(angle) * 3, y, Math.sin(angle) * 3);
            const m1 = new BABYLON.StandardMaterial("m1", scene);
            m1.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
            p1.material = m1;
            p1.setParent(mesh);

            const p2 = BABYLON.MeshBuilder.CreateSphere("p2", { diameter: 1 }, scene);
            p2.position = new BABYLON.Vector3(-Math.cos(angle) * 3, y, -Math.sin(angle) * 3);
            const m2 = new BABYLON.StandardMaterial("m2", scene);
            m2.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8);
            p2.material = m2;
            p2.setParent(mesh);

            const link = BABYLON.MeshBuilder.CreateCylinder("link", { height: 6, diameter: 0.2 }, scene);
            link.position.y = y;
            link.rotation.z = Math.PI / 2;
            link.rotation.x = -angle;
            link.setParent(mesh);
        }

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

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && lazyGuide && <EduOverlay lazyGuide={lazyGuide} />}
        </div>
    );
};

export default DNASim;
