import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import EduOverlay from '../components/EduOverlay';

const MolecularSim = ({ settings, onUpdate, isRunning, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const moleculeRef = useRef(null);

    const moleculeType = settings.molecule || 'H2O';

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        createLabEnvironment(scene, { preset: 'LAB_WHITE', gridSize: 10 });
        createLabLighting(scene, { intensity: 1.2 });
        createLabCamera(scene, new BABYLON.Vector3(0, 2, 0), { radius: 15 });

        const root = new BABYLON.TransformNode("root", scene);

        const createAtom = (name, color, pos, size = 1) => {
            const atom = BABYLON.MeshBuilder.CreateSphere(name, { diameter: size }, scene);
            atom.position = pos;
            atom.material = new BABYLON.StandardMaterial(name + "Mat", scene);
            atom.material.diffuseColor = color;
            atom.parent = root;
            return atom;
        };

        const createBond = (p1, p2) => {
            const bond = BABYLON.MeshBuilder.CreateCylinder("bond", { diameter: 0.2, height: BABYLON.Vector3.Distance(p1, p2) }, scene);
            bond.position = BABYLON.Vector3.Lerp(p1, p2, 0.5);
            const dist = p2.subtract(p1);
            bond.quaternion = BABYLON.Quaternion.FromUnitVectorsToQuaternion(BABYLON.Axis.Y, dist.normalize());
            bond.parent = root;
        };

        if (moleculeType === 'H2O') {
            const o = createAtom("O", new BABYLON.Color3(1, 0, 0), BABYLON.Vector3.Zero(), 1.2);
            const h1 = createAtom("H1", new BABYLON.Color3(1, 1, 1), new BABYLON.Vector3(1, 0.8, 0), 0.7);
            const h2 = createAtom("H2", new BABYLON.Color3(1, 1, 1), new BABYLON.Vector3(-1, 0.8, 0), 0.7);
            createBond(o.position, h1.position);
            createBond(o.position, h2.position);
        } else if (moleculeType === 'CO2') {
            const c = createAtom("C", new BABYLON.Color3(0.2, 0.2, 0.2), BABYLON.Vector3.Zero(), 1.2);
            const o1 = createAtom("O1", new BABYLON.Color3(1, 0, 0), new BABYLON.Vector3(2, 0, 0), 1.0);
            const o2 = createAtom("O2", new BABYLON.Color3(1, 0, 0), new BABYLON.Vector3(-2, 0, 0), 1.0);
            createBond(c.position, o1.position);
            createBond(c.position, o2.position);
        } else if (moleculeType === 'CH4') {
            const c = createAtom("C", new BABYLON.Color3(0.2, 0.2, 0.2), BABYLON.Vector3.Zero(), 1.2);
            const positions = [
                new BABYLON.Vector3(1, 1, 1),
                new BABYLON.Vector3(-1, -1, 1),
                new BABYLON.Vector3(1, -1, -1),
                new BABYLON.Vector3(-1, 1, -1)
            ];
            positions.forEach((p, i) => {
                const h = createAtom("H"+i, new BABYLON.Color3(1, 1, 1), p, 0.7);
                createBond(c.position, h.position);
            });
        }

        moleculeRef.current = root;
        engineRef.current = engine;
        sceneRef.current = scene;
        engine.runRenderLoop(() => scene.render());

        return () => engine.dispose();
    }, [moleculeType]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const updateLoop = () => {
            if (isRunning && moleculeRef.current) {
                moleculeRef.current.rotation.y += 0.01;
                onUpdate({
                    geometry: moleculeType === 'H2O' ? 'Bent' : moleculeType === 'CO2' ? 'Linear' : 'Tetrahedral',
                    bondAngle: moleculeType === 'H2O' ? '104.5°' : moleculeType === 'CO2' ? '180°' : '109.5°',
                    polarity: moleculeType === 'CO2' ? 'Non-polar' : 'Polar'
                });
            }
        };

        scene.onBeforeRenderObservable.add(updateLoop);
        return () => scene.onBeforeRenderObservable.removeCallback(updateLoop);
    }, [isRunning, moleculeType, onUpdate]);

    const eduData = {
        formula: "VSEPR Theory: Shape Prediction",
        variables: {
            "Molecule": moleculeType,
            "Geometry": moleculeType === 'H2O' ? 'Bent' : moleculeType === 'CO2' ? 'Linear' : 'Tetrahedral',
            "Hybridization": moleculeType === 'CO2' ? 'sp' : 'sp³'
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f4f8', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default MolecularSim;
