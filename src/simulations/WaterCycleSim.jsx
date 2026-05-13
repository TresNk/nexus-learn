import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const WaterCycleSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const particlesRef = useRef(null);

    const heat = Number(settings.heat) || 50;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'OUTDOOR', gridSize: 50 });
        createLabLighting(scene, { intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(0, 10, 25), { radius: 50 });

        // Sea
        const sea = BABYLON.MeshBuilder.CreateGround("sea", { width: 40, height: 40 }, scene);
        const seaMat = new BABYLON.StandardMaterial("seaMat", scene);
        seaMat.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.8);
        sea.material = seaMat;

        // Evaporation Particles
        const ps = new BABYLON.ParticleSystem("evap", 500, scene);
        ps.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJS_Samples/master/ParticleSystems/SoftAlpha/Circle_01.png", scene);
        ps.emitter = new BABYLON.Vector3(0, 0, 0);
        ps.minEmitBox = new BABYLON.Vector3(-15, 0, -15);
        ps.maxEmitBox = new BABYLON.Vector3(15, 1, 15);
        ps.color1 = new BABYLON.Color4(1, 1, 1, 0.5);
        ps.minSize = 0.1;
        ps.maxSize = 0.3;
        ps.gravity = new BABYLON.Vector3(0, 2, 0);
        ps.start();
        particlesRef.current = ps;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !particlesRef.current) return;

        const updateLoop = () => {
            if (isRunning) {
                particlesRef.current.emitRate = heat * 10;
                onUpdate({
                    evaporationRate: (heat * 0.5).toFixed(1) + " L/m²/day",
                    status: heat > 70 ? "Rapid Evaporation" : "Steady Cycle"
                });
            } else {
                particlesRef.current.emitRate = 0;
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, heat, onUpdate]);

    const eduData = {
        formula: "E = f(Temperature, Humidity, Wind)",
        variables: {
            "Heat Intensity": heat + "%",
            "State Change": "Liquid → Vapor",
            "Energy Source": "Solar Radiation"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#87ceeb', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default WaterCycleSim;
