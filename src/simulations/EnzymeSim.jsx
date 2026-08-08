import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import EduOverlay from '../components/EduOverlay';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const EnzymeSim = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true, onTelemetry }) => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.05, 0.02, 0.05, 1);

        createLabEnvironment(scene, { gridSize: 15, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(0, 8, 12), { radius: 18 });
        enableWebXR(scene);

        // Create enzyme (lock shape with active site)
        const enzyme = BABYLON.MeshBuilder.CreateSphere('enzyme', { diameter: 6, segments: 32 }, scene);
        const enzymeMat = new BABYLON.PBRMaterial('enzymeMat', scene);
        enzymeMat.albedoColor = new BABYLON.Color3(0.8, 0.4, 0.6);
        enzymeMat.metallic = 0.2;
        enzymeMat.roughness = 0.5;
        enzyme.material = enzymeMat;
        enzyme.position.x = -5;

        // Create active site indentation (using CSG-like approach with scaling)
        const activeSite = BABYLON.MeshBuilder.CreateSphere('activeSite', { diameter: 2.5 }, scene);
        const siteMat = new BABYLON.StandardMaterial('siteMat', scene);
        siteMat.diffuseColor = new BABYLON.Color3(0.6, 0.2, 0.4);
        siteMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.2);
        activeSite.material = siteMat;
        activeSite.position.x = -3;

        // Create substrate (key shape)
        const substrate = BABYLON.MeshBuilder.CreateSphere('substrate', { diameter: 2 }, scene);
        const substrateMat = new BABYLON.PBRMaterial('substrateMat', scene);
        substrateMat.albedoColor = new BABYLON.Color3(0.3, 0.7, 0.5);
        substrateMat.metallic = 0.3;
        substrateMat.roughness = 0.6;
        substrate.material = substrateMat;
        substrate.position.x = 8;

        // Product molecules
        const product1 = BABYLON.MeshBuilder.CreateSphere('product1', { diameter: 1.2 }, scene);
        const product2 = BABYLON.MeshBuilder.CreateSphere('product2', { diameter: 1.2 }, scene);
        const prodMat = new BABYLON.StandardMaterial('prodMat', scene);
        prodMat.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.3);
        prodMat.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.05);
        product1.material = prodMat;
        product2.material = prodMat;
        product1.isVisible = false;
        product2.isVisible = false;
        product1.position.x = -5;
        product2.position.x = -5;

        let bindingPhase = 0;
        let catalysisComplete = false;
        const bindingDistance = 13;

        scene.registerBeforeRender(() => {
            if (isRunning) {
                bindingPhase += 0.008;

                if (bindingPhase < 1) {
                    // Substrate approaches enzyme
                    const progress = bindingPhase;
                    substrate.position.x = 8 - progress * bindingDistance;
                    
                    // Induced fit animation (enzyme changes shape slightly)
                    enzyme.scaling.x = 1 + Math.sin(progress * Math.PI) * 0.05;
                    enzyme.scaling.y = 1 - Math.sin(progress * Math.PI) * 0.03;

                    if (onTelemetry) {
                        onTelemetry({
                            phase: 'Binding',
                            substratePosition: substrate.position.x.toFixed(1),
                            activeSiteOccupancy: (progress * 100).toFixed(0) + '%',
                            km: '2.5 mM',
                            vmax: '100 μmol/min'
                        });
                    }
                } else if (bindingPhase < 2 && !catalysisComplete) {
                    // Catalysis occurs
                    substrate.isVisible = false;
                    product1.isVisible = true;
                    product2.isVisible = true;
                    product1.position.x = -5 + (bindingPhase - 1) * 2;
                    product2.position.x = -5 - (bindingPhase - 1) * 2;
                    catalysisComplete = true;

                    if (onTelemetry) {
                        onTelemetry({
                            phase: 'Catalysis',
                            reaction: 'E + S → ES → E + P1 + P2',
                            activationEnergy: 'Reduced by 50%',
                            turnover: '1000 s⁻¹'
                        });
                    }
                } else if (bindingPhase >= 2) {
                    // Products released, reset
                    if (bindingPhase < 3) {
                        product1.position.x = -5 + (bindingPhase - 2) * 8;
                        product2.position.x = -5 - (bindingPhase - 2) * 8;
                    } else {
                        bindingPhase = 0;
                        catalysisComplete = false;
                        substrate.position.x = 8;
                        substrate.isVisible = true;
                        product1.isVisible = false;
                        product2.isVisible = false;
                        enzyme.scaling = new BABYLON.Vector3(1, 1, 1);
                    }

                    if (onTelemetry) {
                        onTelemetry({
                            phase: 'Product Release',
                            productsFormed: catalysisComplete ? 2 : 0,
                            enzymeAvailability: '100%'
                        });
                    }
                }
            }
        });

        engine.runRenderLoop(() => scene.render());

        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            scene.dispose();
            engine.dispose();
        };
    }, [settings, isRunning, triggerReset, onTelemetry]);

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#050205', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && lazyGuide && <EduOverlay lazyGuide={lazyGuide} />}
            
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <h3 className="font-bold mb-2 text-pink-400">Enzyme Catalysis</h3>
                <p>Lock & Key Model</p>
                <p>Induced Fit</p>
                <p>Michaelis-Menten Kinetics</p>
            </div>
        </div>
    );
};

export default EnzymeSim;
