import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const ClimateSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const earthRef = useRef(null);

    const tilt = Number(settings.tilt) || 23.5;
    const month = settings.month || 'June';

    // Derive intensity during render to avoid cascading renders
    const monthOffset = month === 'June' ? 1 : month === 'December' ? -1 : 0;
    const intensity = 1000 * Math.cos(BABYLON.Tools.ToRadians(tilt * -monthOffset));

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'SPACE', gridSize: 20, showGrid: false });
        createLabLighting(scene, { intensity: 0.2 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 25), { radius: 45 });

        // Sun (Directional Light from right)
        const sunLight = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(-1, -0.2, 0), scene);
        sunLight.intensity = 3;

        const sunSphere = BABYLON.MeshBuilder.CreateSphere("sunSphere", { diameter: 5 }, scene);
        sunSphere.position = new BABYLON.Vector3(30, 5, 0);
        const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor = new BABYLON.Color3(1, 1, 0.5);
        sunSphere.material = sunMat;

        // Earth
        const earth = BABYLON.MeshBuilder.CreateSphere("earth", { diameter: 10, segments: 32 }, scene);
        const earthMat = new BABYLON.StandardMaterial("earthMat", scene);
        earthMat.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-built-in-assets.com/textures/earth.jpg", scene);
        // Fallback color if texture fails
        earthMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.8);
        earth.material = earthMat;

        // Earth Axial Tilt
        earth.rotation.z = BABYLON.Tools.ToRadians(tilt);
        earthRef.current = earth;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, [tilt]);

    useEffect(() => {
        const scene = sceneRef.current;
        const earth = earthRef.current;
        if (!scene || !earth) return;

        earth.rotation.z = BABYLON.Tools.ToRadians(tilt);

        const updateLoop = () => {
            if (isRunning) {
                earth.rotation.y += 0.01; // Daily rotation
                onUpdate({
                    solarInsolation: intensity.toFixed(0) + " W/m²",
                    hemisphere: month === 'June' ? 'North: Summer' : month === 'December' ? 'North: Winter' : 'Equinox',
                    rotation: 'Active'
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, tilt, month, onUpdate, intensity]);

    const eduData = {
        formula: "Insolation (I) = S₀ × cos(θ)",
        variables: {
            "Axial Tilt": tilt + "°",
            "Month": month,
            "Solar Intensity": intensity.toFixed(0) + " W/m²"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default ClimateSim;
