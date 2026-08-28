import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import EduOverlay from '../components/EduOverlay';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const TitrationSim = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);

        createLabEnvironment(scene, { gridSize: 30, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 0), { radius: 25 });

        enableWebXR(scene);

        // PBR Materials for realistic glass rendering
        const pbrGlass = new BABYLON.PBRMaterial("pbrGlass", scene);
        pbrGlass.alpha = 0.3;
        pbrGlass.refractionIntensity = 1.0;
        pbrGlass.refractionIndex = 1.5; // IOR for glass
        pbrGlass.metallic = 0.0;
        pbrGlass.roughness = 0.05; // Very smooth surface
        pbrGlass.subSurface.isRefractionEnabled = true;
        
        // Environment reflection for realistic glass
        const hdriTexture = new BABYLON.CubeTexture.CreateFromBase64String(
            "data:image/png;base64,...", // Would use actual HDRI in production
            scene
        );
        pbrGlass.environmentTexture = hdriTexture;

        const beaker = BABYLON.MeshBuilder.CreateCylinder("beaker", { height: 8, diameter: 6, tessellation: 32 }, scene);
        beaker.position.y = 4;
        beaker.material = pbrGlass;

        // Liquid with PBR material for accurate color interpolation
        const liquidPBR = new BABYLON.PBRMaterial("liquidPBR", scene);
        liquidPBR.alpha = 0.8;
        liquidPBR.metallic = 0.0;
        liquidPBR.roughness = 0.3;
        liquidPBR.subSurface.isRefractionEnabled = true;
        liquidPBR.refractionIndex = 1.33; // IOR for water-based solution

        const liquid = BABYLON.MeshBuilder.CreateCylinder("liquid", { height: 7.8, diameter: 5.8, tessellation: 32 }, scene);
        liquid.position.y = 4;
        liquid.material = liquidPBR;

        const tube = BABYLON.MeshBuilder.CreateCylinder("tube", { height: 10, diameter: 1, tessellation: 32 }, scene);
        tube.position.y = 14;
        tube.material = pbrGlass;

        // Store liquid ref for loop
        const mesh = liquid;
        const baseColor = new BABYLON.Color3(0.8, 0.9, 1.0); // Clear solution
        const endpointColor = new BABYLON.Color3(1.0, 0.2, 0.6); // Pink endpoint

        engine.runRenderLoop(() => {
            scene.render();
            if (isRunning) {
                const vol = settings.volume || 50;
                // Gradual pH-based color interpolation (not instant change)
                // Equivalence point at 50ml, gradual transition from 45-55ml
                const transitionStart = 45;
                const transitionEnd = 55;
                let t = 0;
                
                if (vol <= transitionStart) {
                    t = 0;
                } else if (vol >= transitionEnd) {
                    t = 1;
                } else {
                    t = (vol - transitionStart) / (transitionEnd - transitionStart);
                }
                
                // Smooth interpolation using cubic easing for natural appearance
                const smoothT = t * t * (3 - 2 * t);
                mesh.material.diffuseColor = BABYLON.Color3.Lerp(baseColor, endpointColor, smoothT);
                mesh.material.emissiveColor = BABYLON.Color3.Lerp(new BABYLON.Color3(0, 0, 0), new BABYLON.Color3(0.1, 0, 0.05), smoothT);
            }
        });

        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };
    }, [settings, isRunning, triggerReset]);

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && lazyGuide && <EduOverlay lazyGuide={lazyGuide} />}
        </div>
    );
};

export default TitrationSim;
