import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const ChemistrySim = ({ settings, onUpdate, isRunning }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const liquidRef = useRef(null);
    const dropSystemRef = useRef(null);
    const [livePhysicsData, setLivePhysicsData] = useState(null);
    const [annotations] = useState([]);

    const acidVol = Number(settings.acidVolume) || 25;
    const acidConc = Number(settings.acidConcentration) || 0.1;
    const baseConc = Number(settings.baseConcentration) || 0.1;
    const equivalenceVol = (acidConc * acidVol) / baseConc;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_WHITE', gridSize: 20 });
        createLabLighting(scene, { preset: 'LAB_WHITE' });
        createLabCamera(scene, new BABYLON.Vector3(0, 2, 0), { radius: 15 });

        const standMat = new BABYLON.StandardMaterial("standMat", scene);
        standMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        const base = BABYLON.MeshBuilder.CreateBox("base", { width: 4, height: 0.2, depth: 4 }, scene);
        base.position.y = 0.1;
        base.material = standMat;

        const rod = BABYLON.MeshBuilder.CreateCylinder("rod", { diameter: 0.15, height: 8 }, scene);
        rod.position = new BABYLON.Vector3(-1.5, 4, 0);
        rod.material = standMat;

        const glassMat = new BABYLON.StandardMaterial("glassMat", scene);
        glassMat.alpha = 0.3;
        glassMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 1.0);
        const beaker = BABYLON.MeshBuilder.CreateCylinder("beaker", { diameter: 2.5, height: 3, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        beaker.position.y = 1.6;
        beaker.material = glassMat;

        const liquidMat = new BABYLON.StandardMaterial("liquidMat", scene);
        liquidMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        liquidMat.alpha = 0.7;
        const liquid = BABYLON.MeshBuilder.CreateCylinder("liquid", { diameter: 2.4, height: 1.5 }, scene);
        liquid.position.y = 0.85;
        liquid.material = liquidMat;
        liquidRef.current = liquid;

        const burette = BABYLON.MeshBuilder.CreateCylinder("burette", { diameter: 0.4, height: 6 }, scene);
        burette.position = new BABYLON.Vector3(0, 6, 0);
        burette.material = glassMat;

        const particleSystem = new BABYLON.ParticleSystem("particles", 100, scene);
        particleSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJS_Samples/master/ParticleSystems/SoftAlpha/Circle_01.png", scene);
        particleSystem.emitter = new BABYLON.Vector3(0, 3, 0);
        particleSystem.color1 = new BABYLON.Color4(0.8, 0.8, 1, 0.8);
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.2;
        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.3;
        particleSystem.emitRate = 0;
        particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
        particleSystem.start();
        dropSystemRef.current = particleSystem;

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, []);

    useEffect(() => {
        if (!sceneRef.current) return;
        onUpdate({ ph: "1.00", baseAdded: "0.00", status: 'Acidic' });
    }, [onUpdate]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !liquidRef.current || !dropSystemRef.current) return;

        let baseAdded = 0;
        const totalBaseToRun = equivalenceVol * 1.2;

        const titrationLoop = () => {
            if (!isRunning) {
                dropSystemRef.current.emitRate = 0;
                return;
            }

            if (baseAdded < totalBaseToRun) {
                dropSystemRef.current.emitRate = 20;
                baseAdded += 0.05;

                const molesH = (acidConc * acidVol) / 1000;
                const molesOH = (baseConc * baseAdded) / 1000;
                let ph;
                let status = 'Acidic';
                let color = new BABYLON.Color3(1, 1, 1);

                if (molesH > molesOH) {
                    const concH = (molesH - molesOH) / ((acidVol + baseAdded) / 1000);
                    ph = -Math.log10(concH);
                } else {
                    const concOH = (molesOH - molesH) / ((acidVol + baseAdded) / 1000);
                    ph = 14 + Math.log10(concOH || 1e-14);
                    status = 'Basic';
                    const intensity = Math.min(1, (ph - 7) / 2);
                    color = new BABYLON.Color3(1, 1 - intensity * 0.5, 1 - intensity * 0.2);
                }

                if (ph > 8.2) {
                    const pinkIntensity = Math.min(1, (ph - 8.2) / 1);
                    color = new BABYLON.Color3(1, 1 - pinkIntensity * 0.6, 1 - pinkIntensity * 0.3);
                }

                liquidRef.current.material.diffuseColor = color;
                setLivePhysicsData({ ph, baseAdded, status });

                onUpdate({
                    ph: ph.toFixed(2),
                    baseAdded: baseAdded.toFixed(2),
                    status: status
                });
            } else {
                dropSystemRef.current.emitRate = 0;
            }
        };

        scene.onBeforeRenderObservable.add(titrationLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(titrationLoop);
    }, [isRunning, acidVol, acidConc, baseConc, equivalenceVol, onUpdate]);

    const displayPH = livePhysicsData ? livePhysicsData.ph : 1.0;
    const displayBase = livePhysicsData ? livePhysicsData.baseAdded : 0;
    const displayStatus = livePhysicsData ? livePhysicsData.status : 'Acidic';

    const eduData = {
        formula: "M₁V₁ = M₂V₂",
        variables: {
            "Acid M": acidConc,
            "Acid V": acidVol + "mL",
            "pH": displayPH.toFixed(2),
            "Base Added": displayBase.toFixed(2) + "mL",
            "Status": displayStatus
        },
        annotations: annotations
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            <EduOverlay {...eduData} />
        </div>
    );
};

export default ChemistrySim;