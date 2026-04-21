import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

const ChemistrySim = ({ onUpdate }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.05, 1);

        const camera = new BABYLON.ArcRotateCamera("cam", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvasRef.current, true);
        new BABYLON.HemisphericLight("l", new BABYLON.Vector3(0, 1, 0), scene);

        // Placeholder: Let's create two "Atoms"
        const atom1 = BABYLON.MeshBuilder.CreateSphere("sodium", { diameter: 1.5 }, scene);
        atom1.position.x = -3;
        const mat1 = new BABYLON.StandardMaterial("m1", scene);
        mat1.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
        atom1.material = mat1;

        const atom2 = BABYLON.MeshBuilder.CreateSphere("chlorine", { diameter: 2 }, scene);
        atom2.position.x = 3;
        const mat2 = new BABYLON.StandardMaterial("m2", scene);
        mat2.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
        atom2.material = mat2;

        engine.runRenderLoop(() => scene.render());
        return () => engine.dispose();
    }, []);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />;
};

export default ChemistrySim;