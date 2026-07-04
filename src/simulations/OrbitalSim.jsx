import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import EduOverlay from '../components/EduOverlay';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const OrbitalSim = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true }) => {
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
        const sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 8 }, scene);
        const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
        sun.material = sunMat;

        const planet = BABYLON.MeshBuilder.CreateSphere("planet", { diameter: 2 }, scene);
        const planetMat = new BABYLON.StandardMaterial("planetMat", scene);
        planetMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
        planet.material = planetMat;

        // Trail
        const trail = new BABYLON.TrailMesh("trail", planet, scene, 0.2, 60, true);
        const trailMat = new BABYLON.StandardMaterial("trailMat", scene);
        trailMat.emissiveColor = new BABYLON.Color3(0.2, 0.5, 1);
        trail.material = trailMat;

        let alpha = 0;

        engine.runRenderLoop(() => {
            scene.render();
            if (isRunning) {
                alpha += 0.02 * (settings.velocity || 15) / 15;
                const r = 15;
                planet.position.x = r * Math.cos(alpha);
                planet.position.z = r * Math.sin(alpha);
                planet.rotation.y += 0.05;
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

export default OrbitalSim;
