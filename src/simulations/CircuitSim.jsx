import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const CircuitSim = ({ settings, onUpdate, isRunning, triggerReset, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const wireRefs = useRef([]);
    const [annotations, setAnnotations] = useState([]);

    const voltage = Number(settings.voltage) || 12;
    const r1 = Number(settings.r1) || 10;
    const r2 = Number(settings.r2) || 20;
    const config = settings.config || 'series';
    
    let totalR, current, v1, v2;
    if (config === 'series') {
        totalR = r1 + r2;
        current = voltage / totalR;
        v1 = current * r1;
        v2 = current * r2;
    } else {
        totalR = (r1 * r2) / (r1 + r2);
        current = voltage / totalR;
        v1 = voltage;
        v2 = voltage;
    }

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 15, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, BABYLON.Vector3.Zero(), { radius: 25 });

        const boardMat = new BABYLON.StandardMaterial("bm", scene);
        boardMat.diffuseColor = new BABYLON.Color3(0.05, 0.08, 0.05);
        const board = BABYLON.MeshBuilder.CreateBox("board", { width: 20, height: 0.2, depth: 12 }, scene);
        board.position.y = -0.1;
        board.material = boardMat;

        const battMat = new BABYLON.StandardMaterial("batm", scene);
        battMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        const battery = BABYLON.MeshBuilder.CreateBox("battery", { width: 2, height: 3, depth: 1.5 }, scene);
        battery.position = new BABYLON.Vector3(-7, 1.5, 0);
        battery.material = battMat;

        const posMat = new BABYLON.StandardMaterial("pm", scene);
        posMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
        posMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.1);
        const posTerm = BABYLON.MeshBuilder.CreateCylinder("pos", { diameter: 0.4, height: 0.5 }, scene);
        posTerm.position = new BABYLON.Vector3(-7, 3.25, 0);
        posTerm.material = posMat;

        const negMat = new BABYLON.StandardMaterial("nm", scene);
        negMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 1);
        negMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.3);
        const negTerm = BABYLON.MeshBuilder.CreateCylinder("neg", { diameter: 0.4, height: 0.5 }, scene);
        negTerm.position = new BABYLON.Vector3(-7, -0.25, 0);
        negTerm.material = negMat;

        const resMat = new BABYLON.StandardMaterial("rm", scene);
        resMat.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4);
        resMat.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.1);
        
        const r1Box = BABYLON.MeshBuilder.CreateBox("r1", { width: 3, height: 1, depth: 1 }, scene);
        r1Box.position = new BABYLON.Vector3(0, 0, -3);
        r1Box.material = resMat;
        
        const r2Box = BABYLON.MeshBuilder.CreateBox("r2", { width: 3, height: 1, depth: 1 }, scene);
        r2Box.position = new BABYLON.Vector3(0, 0, 3);
        r2Box.material = resMat;

        const voltMat = new BABYLON.StandardMaterial("vm", scene);
        voltMat.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.1);
        voltMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0);
        const voltmeter = BABYLON.MeshBuilder.CreateBox("voltmeter", { width: 2.5, height: 2, depth: 0.5 }, scene);
        voltmeter.position = new BABYLON.Vector3(6, 2, 0);
        voltmeter.material = voltMat;

        const ammeterMat = new BABYLON.StandardMaterial("am", scene);
        ammeterMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.3);
        ammeterMat.emissiveColor = new BABYLON.Color3(0, 0.1, 0.4);
        const ammeter = BABYLON.MeshBuilder.CreateBox("ammeter", { width: 2, height: 2, depth: 0.5 }, scene);
        ammeter.position = new BABYLON.Vector3(-3, 0, 0);
        ammeter.material = ammeterMat;

        engineRef.current = engine;
        sceneRef.current = scene;

        engine.runRenderLoop(() => scene.render());
        const resize = () => engine.resize();
        window.addEventListener("resize", resize);
        setTimeout(resize, 100);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };
    }, []);

    useEffect(() => {
        if (!sceneRef.current) return;
        setAnnotations([]);

        onUpdate({
            voltage: voltage + " V",
            "R1": r1 + " Ω",
            "R2": r2 + " Ω",
            config: config,
            current: (current * 1000).toFixed(1) + " mA",
            "total R": totalR.toFixed(1) + " Ω",
            "V drop": (config === 'series' ? v1 : v2).toFixed(1) + " V"
        });

        if (config === 'series') {
            setAnnotations([{ t: "Series", text: `R_total = ${r1} + ${r2} = ${totalR}Ω. Current = ${(current*1000).toFixed(1)}mA through both resistors` }]);
        } else {
            setAnnotations([{ t: "Parallel", text: `R_total = (${r1} × ${r2}) / (${r1} + ${r2}) = ${totalR.toFixed(1)}Ω. V same across both branches` }]);
        }
    }, [settings.voltage, settings.r1, settings.r2, settings.config, triggerReset, voltage, r1, r2, config, totalR, current, v1, v2]);

    const eduData = {
        formula: config === 'series' ? "R_total = R1 + R2" : "1/R_total = 1/R1 + 1/R2",
        variables: {
            "V": `${voltage} V`,
            "R1": `${r1} Ω`,
            "R2": `${r2} Ω`,
            "I": `${(current * 1000).toFixed(1)} mA`,
            "R_total": `${totalR.toFixed(1)} Ω`
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

export default CircuitSim;