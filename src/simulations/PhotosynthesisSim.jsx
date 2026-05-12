import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const PhotosynthesisSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const particlesRef = useRef(null);
    const lightRef = useRef(null);

    const lightIntensity = Number(settings.lightIntensity) || 50;
    const co2Level = Number(settings.co2Level) || 400;

    // Derive production rate during render to avoid cascading renders
    const productionRate = (lightIntensity / 100) * (co2Level / 400);

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_WHITE', gridSize: 10 });
        createLabLighting(scene, { intensity: 0.5 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 12), { radius: 20 });

        // Plant Model
        const pot = BABYLON.MeshBuilder.CreateCylinder("pot", { diameterTop: 2, diameterBottom: 1.5, height: 1.5 }, scene);
        const potMat = new BABYLON.StandardMaterial("potMat", scene);
        potMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.2);
        pot.material = potMat;
        pot.position.y = 0.75;

        const stem = BABYLON.MeshBuilder.CreateCylinder("stem", { diameter: 0.2, height: 4 }, scene);
        const stemMat = new BABYLON.StandardMaterial("stemMat", scene);
        stemMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.2);
        stem.material = stemMat;
        stem.position.y = 3.5;

        for (let i = 0; i < 6; i++) {
            const leaf = BABYLON.MeshBuilder.CreateSphere("leaf" + i, { diameterX: 1.5, diameterY: 0.1, diameterZ: 0.8 }, scene);
            leaf.material = stemMat;
            leaf.position.y = 2 + i * 0.5;
            leaf.position.x = Math.sin(i * Math.PI / 3) * 1;
            leaf.position.z = Math.cos(i * Math.PI / 3) * 1;
            leaf.rotation.y = i * Math.PI / 3;
            leaf.rotation.z = 0.2;
        }

        // Light Source (LED Panel)
        const lightBox = BABYLON.MeshBuilder.CreateBox("lightBox", { width: 3, height: 0.2, depth: 3 }, scene);
        lightBox.position.y = 8;
        const lightBoxMat = new BABYLON.StandardMaterial("lightBoxMat", scene);
        lightBoxMat.emissiveColor = new BABYLON.Color3(1, 1, 0.8);
        lightBox.material = lightBoxMat;

        const spotLight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 8, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
        spotLight.intensity = lightIntensity / 50;
        lightRef.current = spotLight;

        // Oxygen Particles
        const particleSystem = new BABYLON.ParticleSystem("o2Particles", 200, scene);
        particleSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJS_Samples/master/ParticleSystems/SoftAlpha/Circle_01.png", scene);
        particleSystem.emitter = new BABYLON.Vector3(0, 4, 0);
        particleSystem.minEmitBox = new BABYLON.Vector3(-1, -1, -1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(1, 1, 1);
        particleSystem.color1 = new BABYLON.Color4(0.7, 0.9, 1, 0.8);
        particleSystem.minSize = 0.05;
        particleSystem.maxSize = 0.15;
        particleSystem.minLifeTime = 1.0;
        particleSystem.maxLifeTime = 2.0;
        particleSystem.emitRate = 0;
        particleSystem.gravity = new BABYLON.Vector3(0, 0.5, 0);
        particleSystem.start();
        particlesRef.current = particleSystem;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, [lightIntensity]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !particlesRef.current || !lightRef.current) return;

        lightRef.current.intensity = lightIntensity / 50;

        const updateLoop = () => {
            if (isRunning) {
                particlesRef.current.emitRate = productionRate * 100;
                onUpdate({
                    o2Rate: (productionRate * 10).toFixed(2) + " mmol/s",
                    status: 'Producing Glucose',
                    efficiency: (productionRate * 100).toFixed(1) + "%"
                });
            } else {
                particlesRef.current.emitRate = 0;
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, lightIntensity, co2Level, onUpdate, productionRate]);

    const eduData = {
        formula: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂",
        variables: {
            "Light": lightIntensity + " W/m²",
            "CO₂": co2Level + " ppm",
            "O₂ Rate": (productionRate * 10).toFixed(2) + " mmol/s"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f4f8', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default PhotosynthesisSim;
