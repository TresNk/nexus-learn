import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import EduOverlay from '../components/EduOverlay';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const NeuronSim = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true, onTelemetry }) => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.05, 1);

        createLabEnvironment(scene, { gridSize: 20, showGrid: true });
        createLabLighting(scene, { intensity: 0.8 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 15), { radius: 20 });
        enableWebXR(scene);

        // Create neuron structure
        // Cell body (soma)
        const soma = BABYLON.MeshBuilder.CreateSphere('soma', { diameter: 4, segments: 32 }, scene);
        const somaMat = new BABYLON.PBRMaterial('somaMat', scene);
        somaMat.albedoColor = new BABYLON.Color3(0.9, 0.7, 0.6);
        somaMat.metallic = 0.0;
        somaMat.roughness = 0.4;
        soma.material = somaMat;
        soma.position.x = -8;

        // Axon
        const axon = BABYLON.MeshBuilder.CreateTube('axon', {
            path: [new BABYLON.Vector3(-6, 0, 0), new BABYLON.Vector3(8, 0, 0)],
            radius: 0.5
        }, scene);
        const axonMat = new BABYLON.StandardMaterial('axonMat', scene);
        axonMat.diffuseColor = new BABYLON.Color3(0.8, 0.85, 0.9);
        axon.material = axonMat;

        // Dendrites
        const dendrites = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI - Math.PI / 2;
            const dendrite = BABYLON.MeshBuilder.CreateTube(`dendrite${i}`, {
                path: [
                    new BABYLON.Vector3(-8, 0, 0),
                    new BABYLON.Vector3(-10 + Math.cos(angle) * 2, Math.sin(angle) * 2, 0)
                ],
                radius: 0.3
            }, scene);
            dendrite.material = axonMat;
            dendrites.push(dendrite);
        }

        // Action potential wave visualization using custom shader
        const wavePosition = useRef(-8);
        const waveMesh = BABYLON.MeshBuilder.CreateSphere('wave', { diameter: 1 }, scene);
        const waveMat = new BABYLON.StandardMaterial('waveMat', scene);
        waveMat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1);
        waveMat.disableLighting = true;
        waveMesh.material = waveMat;
        waveMesh.position.x = -8;

        // Ion channel markers
        const channels = [];
        for (let i = -6; i <= 8; i += 2) {
            const naChannel = BABYLON.MeshBuilder.CreateSphere(`na${i}`, { diameter: 0.4 }, scene);
            const naMat = new BABYLON.StandardMaterial('naMat', scene);
            naMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0.2);
            naChannel.material = naMat;
            naChannel.position.x = i;
            naChannel.position.y = 0.6;
            channels.push({ type: 'Na+', mesh: naChannel, open: false });

            const kChannel = BABYLON.MeshBuilder.CreateSphere(`k${i}`, { diameter: 0.4 }, scene);
            const kMat = new BABYLON.StandardMaterial('kMat', scene);
            kMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);
            kChannel.material = kMat;
            kChannel.position.x = i;
            kChannel.position.y = -0.6;
            channels.push({ type: 'K+', mesh: kChannel, open: false });
        }

        let membranePotential = -70; // mV (resting potential)
        let actionPotentialActive = false;
        let depolarizationPhase = 0;

        scene.registerBeforeRender(() => {
            if (isRunning) {
                // Simulate action potential propagation
                if (!actionPotentialActive && settings?.stimulate) {
                    actionPotentialActive = true;
                    depolarizationPhase = 0;
                }

                if (actionPotentialActive) {
                    depolarizationPhase += 0.02;
                    
                    // Move wave along axon
                    wavePosition.current = -8 + depolarizationPhase * 8;
                    waveMesh.position.x = wavePosition.current;

                    // Membrane potential changes (Hodgkin-Huxley simplified)
                    if (depolarizationPhase < 0.3) {
                        // Depolarization (Na+ channels open)
                        membranePotential = -70 + (depolarizationPhase / 0.3) * 110;
                        channels.forEach(ch => {
                            if (ch.type === 'Na+') {
                                ch.mesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
                                ch.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.8, 0.3);
                            }
                        });
                    } else if (depolarizationPhase < 0.6) {
                        // Repolarization (K+ channels open)
                        membranePotential = 40 - ((depolarizationPhase - 0.3) / 0.3) * 120;
                        channels.forEach(ch => {
                            if (ch.type === 'K+') {
                                ch.mesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
                                ch.mesh.material.emissiveColor = new BABYLON.Color3(0.5, 1, 0.8);
                            } else {
                                ch.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
                                ch.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                            }
                        });
                    } else if (depolarizationPhase < 0.8) {
                        // Hyperpolarization
                        membranePotential = -80 + ((depolarizationPhase - 0.6) / 0.2) * 10;
                        channels.forEach(ch => {
                            ch.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
                            ch.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                        });
                    } else {
                        // Reset to resting potential
                        membranePotential = -70;
                        actionPotentialActive = false;
                        depolarizationPhase = 0;
                        wavePosition.current = -8;
                    }

                    // Send telemetry
                    if (onTelemetry) {
                        onTelemetry({
                            membranePotential: membranePotential.toFixed(1),
                            phase: depolarizationPhase < 0.3 ? 'Depolarization' : 
                                   depolarizationPhase < 0.6 ? 'Repolarization' : 
                                   depolarizationPhase < 0.8 ? 'Hyperpolarization' : 'Resting',
                            naChannelsOpen: depolarizationPhase < 0.3 ? 'Yes' : 'No',
                            kChannelsOpen: depolarizationPhase >= 0.3 && depolarizationPhase < 0.6 ? 'Yes' : 'No',
                            threshold: '-55 mV'
                        });
                    }
                } else {
                    membranePotential = -70;
                    if (onTelemetry) {
                        onTelemetry({
                            membranePotential: '-70.0',
                            phase: 'Resting',
                            naChannelsOpen: 'No',
                            kChannelsOpen: 'No',
                            threshold: '-55 mV'
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
        <div style={{ width: '100%', height: '100%', backgroundColor: '#020305', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && lazyGuide && <EduOverlay lazyGuide={lazyGuide} />}
            
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <h3 className="font-bold mb-2 text-cyan-400">Action Potential</h3>
                <p>Hodgkin-Huxley Model</p>
                <p>Nernst Potential</p>
            </div>
        </div>
    );
};

export default NeuronSim;
