import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import EduOverlay from '../components/EduOverlay';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const PolymerizationSim = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true, onTelemetry }) => {
    const canvasRef = useRef(null);
    const monomersRef = useRef([]);
    const chainsRef = useRef([]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.1, 1);

        createLabEnvironment(scene, { gridSize: 20, showGrid: true });
        createLabLighting(scene, { intensity: 0.8 });
        createLabCamera(scene, new BABYLON.Vector3(0, 10, 0), { radius: 30 });
        enableWebXR(scene);

        // Create monomer units
        const monomerCount = settings?.monomerCount || 20;
        const monomers = [];
        
        for (let i = 0; i < monomerCount; i++) {
            const monomer = BABYLON.MeshBuilder.CreateSphere(`monomer${i}`, { diameter: 1.5 }, scene);
            const mat = new BABYLON.PBRMaterial(`monoMat${i}`, scene);
            mat.albedoColor = new BABYLON.Color3(0.2, 0.8, 0.5);
            mat.metallic = 0.2;
            mat.roughness = 0.6;
            monomer.material = mat;
            
            // Position randomly in a circle
            const angle = (i / monomerCount) * Math.PI * 2;
            const radius = 8;
            monomer.position.x = Math.cos(angle) * radius;
            monomer.position.z = Math.sin(angle) * radius;
            monomer.position.y = 0;
            
            monomers.push(monomer);
        }
        monomersRef.current = monomers;

        // Chains storage
        const chains = [];
        chainsRef.current = chains;

        let chainGrowth = 0;
        const maxChainLength = settings?.chainLength || 10;

        scene.registerBeforeRender(() => {
            if (isRunning) {
                chainGrowth += 0.01;
                
                // Animate monomers moving toward each other
                monomers.forEach((monomer, idx) => {
                    const targetAngle = (idx / monomerCount) * Math.PI * 2 + chainGrowth;
                    const targetRadius = Math.max(3, 8 - chainGrowth * 5);
                    
                    monomer.position.x = Math.cos(targetAngle) * targetRadius;
                    monomer.position.z = Math.sin(targetAngle) * targetRadius;
                    monomer.rotation.y += 0.02;
                });

                // Send telemetry
                if (onTelemetry) {
                    onTelemetry({
                        chainLength: Math.floor(chainGrowth * maxChainLength),
                        monomersLinked: Math.min(monomers.length, Math.floor(chainGrowth * monomers.length)),
                        degreeOfPolymerization: (chainGrowth * 100).toFixed(1),
                        viscosity: (chainGrowth * 50).toFixed(1)
                    });
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
        <div style={{ width: '100%', height: '100%', backgroundColor: '#05050a', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && lazyGuide && <EduOverlay lazyGuide={lazyGuide} />}
            
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <h3 className="font-bold mb-2 text-green-400">Chain-Growth Polymerization</h3>
                <p>Monomers → Polymer Chain</p>
                <p>Degree of Polymerization (DP)</p>
            </div>
        </div>
    );
};

export default PolymerizationSim;
