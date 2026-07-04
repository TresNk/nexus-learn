import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const TectonicsSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const platesRef = useRef([]);

    const plateType = settings.plateType || 'convergent';
    const speed = Number(settings.subductionSpeed) || 5;

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'SPACE', gridSize: 20, showGrid: false });
        createLabLighting(scene, { intensity: 1.2 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 20), { radius: 40 });

        const mantle = BABYLON.MeshBuilder.CreateBox("mantle", { width: 30, height: 2, depth: 20 }, scene);
        mantle.position.y = -2;
        const mantleMat = new BABYLON.StandardMaterial("mantleMat", scene);
        mantleMat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0);
        mantle.material = mantleMat;

        const plate1 = BABYLON.MeshBuilder.CreateBox("plate1", { width: 12, height: 1.5, depth: 15 }, scene);
        plate1.position.x = -7;
        const p1Mat = new BABYLON.StandardMaterial("p1Mat", scene);
        p1Mat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
        plate1.material = p1Mat;

        const plate2 = BABYLON.MeshBuilder.CreateBox("plate2", { width: 12, height: 1.5, depth: 15 }, scene);
        plate2.position.x = 7;
        const p2Mat = new BABYLON.StandardMaterial("p2Mat", scene);
        p2Mat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);
        plate2.material = p2Mat;

        platesRef.current = [plate1, plate2];
        engineRef.current = engine;
        sceneRef.current = scene;

        engine.runRenderLoop(() => scene.render());
        return () => engine.dispose();
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        let time = 0;
        const [p1, p2] = platesRef.current;

        const animatePlates = () => {
            if (!isRunning) return;
            time += 0.01 * speed;

            if (plateType === 'convergent') {
                if (p1.position.x < -1) {
                    p1.position.x += 0.02 * speed;
                    p2.position.x -= 0.02 * speed;
                } else {
                    p1.position.y -= 0.01 * speed;
                    p1.rotation.z = -0.1;
                }
            } else if (plateType === 'divergent') {
                p1.position.x -= 0.02 * speed;
                p2.position.x += 0.02 * speed;
            }

            onUpdate({
                status: plateType === 'convergent' ? 'Subducting' : 'Rifting',
                stress: (time * 10).toFixed(1) + " GPa",
                displacement: (time * 2).toFixed(1) + " km"
            });
        };

        scene.onBeforeRenderObservable.add(animatePlates);
        return () => scene.onBeforeRenderObservable.removeCallback(animatePlates);
    }, [isRunning, plateType, speed, onUpdate]);

    const eduData = {
        formula: "Tectonic Stress (σ) = E × ε",
        variables: {
            "Type": plateType.toUpperCase(),
            "Speed": `${speed} cm/year`,
            "Status": "Active Movement"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default TectonicsSim;