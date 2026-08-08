import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import EduOverlay from '../components/EduOverlay';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const ElectrochemistrySim = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true, onTelemetry }) => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.02, 0.05, 0.08, 1);

        createLabEnvironment(scene, { gridSize: 20, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(0, 8, 15), { radius: 25 });
        enableWebXR(scene);

        // Create Galvanic Cell components
        // Anode (Zinc)
        const anode = BABYLON.MeshBuilder.CreateCylinder('anode', { height: 6, diameter: 3 }, scene);
        const anodeMat = new BABYLON.PBRMaterial('anodeMat', scene);
        anodeMat.albedoColor = new BABYLON.Color3(0.7, 0.7, 0.75);
        anodeMat.metallic = 0.9;
        anodeMat.roughness = 0.3;
        anode.material = anodeMat;
        anode.position.x = -6;

        // Cathode (Copper)
        const cathode = BABYLON.MeshBuilder.CreateCylinder('cathode', { height: 6, diameter: 3 }, scene);
        const cathodeMat = new BABYLON.PBRMaterial('cathodeMat', scene);
        cathodeMat.albedoColor = new BABYLON.Color3(0.8, 0.4, 0.2);
        cathodeMat.metallic = 0.95;
        cathodeMat.roughness = 0.2;
        cathode.material = cathodeMat;
        cathode.position.x = 6;

        // Beakers
        const beakerLeft = BABYLON.MeshBuilder.CreateCylinder('beakerL', { height: 8, diameterTop: 4, diameterBottom: 3 }, scene);
        const beakerMat = new BABYLON.PBRMaterial('glassMat', scene);
        beakerMat.albedoColor = new BABYLON.Color3(0.9, 0.95, 1);
        beakerMat.alpha = 0.4;
        beakerMat.metallic = 0.1;
        beakerMat.roughness = 0.1;
        beakerMat.refraction = 1.5;
        beakerLeft.material = beakerMat;
        beakerLeft.position.x = -6;
        beakerLeft.position.y = -1;

        const beakerRight = BABYLON.MeshBuilder.CreateCylinder('beakerR', { height: 8, diameterTop: 4, diameterBottom: 3 }, scene);
        beakerRight.material = beakerMat;
        beakerRight.position.x = 6;
        beakerRight.position.y = -1;

        // Salt bridge
        const saltBridge = BABYLON.MeshBuilder.CreateTube('saltBridge', {
            path: [new BABYLON.Vector3(-6, 2, 0), new BABYLON.Vector3(0, 4, 0), new BABYLON.Vector3(6, 2, 0)],
            radius: 0.5
        }, scene);
        const bridgeMat = new BABYLON.StandardMaterial('bridgeMat', scene);
        bridgeMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
        bridgeMat.alpha = 0.6;
        saltBridge.material = bridgeMat;

        // Wire connection
        const wire = BABYLON.MeshBuilder.CreateTube('wire', {
            path: [new BABYLON.Vector3(-6, 4, 0), new BABYLON.Vector3(0, 6, 0), new BABYLON.Vector3(6, 4, 0)],
            radius: 0.2
        }, scene);
        const wireMat = new BABYLON.PBRMaterial('wireMat', scene);
        wireMat.albedoColor = new BABYLON.Color3(0.9, 0.7, 0.3);
        wireMat.metallic = 0.9;
        wireMat.roughness = 0.2;
        wire.material = wireMat;

        // Light bulb
        const bulb = BABYLON.MeshBuilder.CreateSphere('bulb', { diameter: 2 }, scene);
        const bulbMat = new BABYLON.StandardMaterial('bulbMat', scene);
        bulbMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.1);
        bulb.material = bulbMat;
        bulb.position.y = 6;

        // Electron particles
        const electronSystem = new BABYLON.ParticleSystem('electrons', 200, scene);
        electronSystem.particleTexture = new BABYLON.Texture('https://assets.babylonjs.com/textures/flare.png', scene);
        electronSystem.emitter = new BABYLON.Vector3(-6, 4, 0);
        electronSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, 0);
        electronSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0);
        electronSystem.color1 = new BABYLON.Color4(0.2, 0.5, 1, 1);
        electronSystem.color2 = new BABYLON.Color4(0.3, 0.6, 1, 1);
        electronSystem.minSize = 0.3;
        electronSystem.maxSize = 0.5;
        electronSystem.minLifeTime = 1;
        electronSystem.maxLifeTime = 2;
        electronSystem.emitRate = 50;
        electronSystem.direction1 = new BABYLON.Vector3(1, 0, 0);
        electronSystem.direction2 = new BABYLON.Vector3(1, 0.2, 0);
        electronSystem.minSpeed = 3;
        electronSystem.maxSpeed = 5;

        // Ion particles in solution
        const ionSystem = new BABYLON.ParticleSystem('ions', 100, scene);
        ionSystem.particleTexture = new BABYLON.Texture('https://assets.babylonjs.com/textures/flare.png', scene);
        ionSystem.emitter = new BABYLON.Vector3(0, 0, 0);
        ionSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
        ionSystem.color2 = new BABYLON.Color4(1, 0.8, 0, 1);
        ionSystem.minSize = 0.2;
        ionSystem.maxSize = 0.4;
        ionSystem.minLifeTime = 3;
        ionSystem.maxLifeTime = 5;
        ionSystem.emitRate = 20;

        let voltage = 0;
        const targetVoltage = settings?.voltage || 1.1;

        scene.registerBeforeRender(() => {
            if (isRunning) {
                // Ramp up voltage
                if (voltage < targetVoltage) {
                    voltage += 0.01;
                }

                // Start electron flow
                electronSystem.start();
                ionSystem.start();

                // Glow effect based on voltage
                bulbMat.emissiveColor = new BABYLON.Color3(voltage, voltage * 0.8, voltage * 0.3);

                // Send telemetry
                if (onTelemetry) {
                    onTelemetry({
                        cellPotential: voltage.toFixed(2),
                        electronFlow: (voltage * 100).toFixed(0),
                        ionMigration: (voltage * 50).toFixed(0),
                        anodeReaction: 'Zn → Zn²⁺ + 2e⁻',
                        cathodeReaction: 'Cu²⁺ + 2e⁻ → Cu'
                    });
                }
            } else {
                electronSystem.stop();
                ionSystem.stop();
                bulbMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.05);
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
        <div style={{ width: '100%', height: '100%', backgroundColor: '#020508', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && lazyGuide && <EduOverlay lazyGuide={lazyGuide} />}
            
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <h3 className="font-bold mb-2 text-yellow-400">Galvanic Cell</h3>
                <p>E°cell = E°cathode - E°anode</p>
                <p>Nernst Equation</p>
            </div>
        </div>
    );
};

export default ElectrochemistrySim;
