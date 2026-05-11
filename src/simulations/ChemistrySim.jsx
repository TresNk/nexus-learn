import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const ChemistrySim = ({ settings, onUpdate, isRunning, triggerReset, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const liquidRef = useRef(null);
    const dropSystemRef = useRef(null);
    const [liveData, setLiveData] = useState({
        ph: 1.0,
        baseAdded: 0.0,
        status: 'Acidic'
    });
    const [annotations, setAnnotations] = useState([]);

    const acidVol = Number(settings.acidVolume) || 25; // mL
    const acidConc = Number(settings.acidConcentration) || 0.1; // M
    const baseConc = Number(settings.baseConcentration) || 0.1; // M
    const equivalenceVol = (acidConc * acidVol) / baseConc;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_WHITE', gridSize: 20 });
        createLabLighting(scene, { preset: 'LAB_WHITE' });
        createLabCamera(scene, new BABYLON.Vector3(0, 2, 0), { radius: 15 });

        // Lab Stand
        const standMat = new BABYLON.StandardMaterial("standMat", scene);
        standMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        const base = BABYLON.MeshBuilder.CreateBox("base", { width: 4, height: 0.2, depth: 4 }, scene);
        base.position.y = 0.1;
        base.material = standMat;

        const rod = BABYLON.MeshBuilder.CreateCylinder("rod", { diameter: 0.15, height: 8 }, scene);
        rod.position = new BABYLON.Vector3(-1.5, 4, 0);
        rod.material = standMat;

        // Beaker
        const glassMat = new BABYLON.StandardMaterial("glassMat", scene);
        glassMat.alpha = 0.3;
        glassMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 1.0);
        const beaker = BABYLON.MeshBuilder.CreateCylinder("beaker", { diameter: 2.5, height: 3, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        beaker.position.y = 1.6;
        beaker.material = glassMat;

        // Liquid in beaker
        const liquidMat = new BABYLON.StandardMaterial("liquidMat", scene);
        liquidMat.diffuseColor = new BABYLON.Color3(1, 1, 1); // Clear (Acid + Phenolphthalein)
        liquidMat.alpha = 0.7;
        const liquid = BABYLON.MeshBuilder.CreateCylinder("liquid", { diameter: 2.4, height: 1.5 }, scene);
        liquid.position.y = 0.85; // Base of beaker is at 0.1 + 0.1(height/2?) no, beaker is at 1.6 height 3 -> bottom at 0.1
        liquid.position.y = 0.85;
        liquid.material = liquidMat;
        liquidRef.current = liquid;

        // Burette
        const burette = BABYLON.MeshBuilder.CreateCylinder("burette", { diameter: 0.4, height: 6 }, scene);
        burette.position = new BABYLON.Vector3(0, 6, 0);
        burette.material = glassMat;

        // Drop system
        const particleSystem = new BABYLON.ParticleSystem("particles", 100, scene);
        particleSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJS_Samples/master/ParticleSystems/SoftAlpha/Circle_01.png", scene);
        particleSystem.emitter = new BABYLON.Vector3(0, 3, 0);
        particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
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
        const scene = sceneRef.current;
        if (!scene || !liquidRef.current || !dropSystemRef.current) return;

        let baseAdded = 0;
        const totalBaseToRun = equivalenceVol * 1.2;

        if (triggerReset) {
            baseAdded = 0;
            setLiveData({ ph: 1.0, baseAdded: 0.0, status: 'Acidic' });
            liquidRef.current.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
            dropSystemRef.current.emitRate = 0;
        }

        const titrationLoop = () => {
            if (!isRunning) {
                dropSystemRef.current.emitRate = 0;
                return;
            }

            if (baseAdded < totalBaseToRun) {
                dropSystemRef.current.emitRate = 20;
                baseAdded += 0.05; // 0.05 mL per frame approx

                // Chemistry Math
                const molesH = (acidConc * acidVol) / 1000;
                const molesOH = (baseConc * baseAdded) / 1000;
                let ph;
                let status = 'Acidic';
                let color = new BABYLON.Color3(1, 1, 1);

                if (molesH > molesOH) {
                    const concH = (molesH - molesOH) / ((acidVol + baseAdded) / 1000);
                    ph = -Math.log10(concH);
                } else if (Math.abs(molesH - molesOH) < 0.0000001) {
                    ph = 7.0;
                    status = 'Neutral';
                    color = new BABYLON.Color3(1, 0.8, 0.9);
                } else {
                    const concOH = (molesOH - molesH) / ((acidVol + baseAdded) / 1000);
                    ph = 14 + Math.log10(concOH);
                    status = 'Basic';
                    // Phenolphthalein turns pink
                    const intensity = Math.min(1, (ph - 7) / 2);
                    color = new BABYLON.Color3(1, 1 - intensity * 0.5, 1 - intensity * 0.2);
                }

                if (ph > 8.2) {
                    const pinkIntensity = Math.min(1, (ph - 8.2) / 1);
                    color = new BABYLON.Color3(1, 1 - pinkIntensity * 0.6, 1 - pinkIntensity * 0.3);
                }

                liquidRef.current.material.diffuseColor = color;

                const currentData = {
                    ph: ph.toFixed(2),
                    baseAdded: baseAdded.toFixed(2),
                    status: status
                };
                setLiveData(currentData);
                onUpdate(currentData);

                if (Math.abs(baseAdded - equivalenceVol) < 0.1) {
                    setAnnotations([{ t: "Equivalence Point", text: `Neutralization achieved! ${baseAdded.toFixed(1)}mL base added.` }]);
                }
            } else {
                dropSystemRef.current.emitRate = 0;
            }
        };

        scene.onBeforeRenderObservable.add(titrationLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(titrationLoop);
    }, [isRunning, triggerReset, acidVol, acidConc, baseConc, equivalenceVol]);

    const eduData = {
        formula: "M₁V₁ = M₂V₂",
        variables: {
            "Acid Conc (M₁)": acidConc + " M",
            "Acid Vol (V₁)": acidVol + " mL",
            "Base Conc (M₂)": baseConc + " M",
            "Base Added": liveData.baseAdded + " mL",
            "pH": liveData.ph,
            "Status": liveData.status
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

export default ChemistrySim;
