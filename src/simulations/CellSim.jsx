import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const CellSim = ({ settings, onUpdate, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const [selectedOrganelle, setSelectedOrganelle] = useState(null);

    const cellType = settings.cellType || 'animal';

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_WHITE', gridSize: 10, showGrid: true });
        createLabLighting(scene, { intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 15), { radius: 25 });

        const membrane = BABYLON.MeshBuilder.CreateSphere("membrane", {
            diameter: 10,
            segments: 32,
            slice: cellType === 'plant' ? 0.8 : 1
        }, scene);
        const memMat = new BABYLON.StandardMaterial("memMat", scene);
        memMat.diffuseColor = cellType === 'plant' ? new BABYLON.Color3(0.2, 0.6, 0.2) : new BABYLON.Color3(0.6, 0.4, 0.7);
        memMat.alpha = 0.3;
        membrane.material = memMat;

        if (cellType === 'plant') {
            const wall = BABYLON.MeshBuilder.CreateBox("cellWall", { width: 11, height: 11, depth: 11 }, scene);
            const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
            wallMat.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.1);
            wallMat.alpha = 0.2;
            wall.material = wallMat;
        }

        const nucleus = BABYLON.MeshBuilder.CreateSphere("Nucleus", { diameter: 3 }, scene);
        const nucMat = new BABYLON.StandardMaterial("nucMat", scene);
        nucMat.diffuseColor = new BABYLON.Color3(0.4, 0.1, 0.5);
        nucleus.material = nucMat;
        nucleus.position = new BABYLON.Vector3(0, 0, 0);

        const mito = BABYLON.MeshBuilder.CreateCapsule("Mitochondria", { radius: 0.5, height: 2 }, scene);
        const mitoMat = new BABYLON.StandardMaterial("mitoMat", scene);
        mitoMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
        mito.material = mitoMat;
        mito.position = new BABYLON.Vector3(3, 1, 2);
        mito.rotation.z = Math.PI / 4;

        scene.onPointerDown = (evt, pickResult) => {
            if (pickResult.hit) {
                const name = pickResult.pickedMesh.name;
                setSelectedOrganelle(name);
                onUpdate({ lastSelected: name });
            }
        };

        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, [cellType, onUpdate]);

    const eduData = {
        formula: "Cell Theory: Basic Unit of Life",
        variables: {
            "Type": cellType.toUpperCase(),
            "Selected": selectedOrganelle || "None",
            "Function": selectedOrganelle === "Nucleus" ? "Control DNA" :
                        selectedOrganelle === "Mitochondria" ? "ATP Production" : "Click to identify"
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f4f8', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default CellSim;