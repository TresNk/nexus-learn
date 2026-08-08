import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import EduOverlay from '../components/EduOverlay';
import { createLabEnvironment, createLabLighting, createLabCamera, enableWebXR } from '../utils/labEnvironment';

const OrbitalSim = ({ settings, isRunning, triggerReset, lazyGuide, eduMode = true, onTelemetry }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const planetRef = useRef(null);
    const sunRef = useRef(null);
    const trailRef = useRef(null);
    const telemetryRef = useRef({ velocity: 0, distance: 0, areaSwept: 0, period: 0 });

    useEffect(() => {
        if (!canvasRef.current) return;
        
        const engine = new BABYLON.Engine(canvasRef.current, true, { 
            preserveDrawingBuffer: true, 
            stencil: true,
            antialias: true
        });
        engineRef.current = engine;
        
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1);
        sceneRef.current = scene;

        createLabEnvironment(scene, { gridSize: 30, showGrid: true });
        createLabLighting(scene, { intensity: 0.9 });
        createLabCamera(scene, new BABYLON.Vector3(0, 5, 0), { radius: 25 });

        enableWebXR(scene);

        // Create Sun with PBR material and glow
        const sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 8, segments: 32 }, scene);
        const sunMat = new BABYLON.PBRMaterial("sunMat", scene);
        sunMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0.2);
        sunMat.disableLighting = true;
        sun.material = sunMat;
        sunRef.current = sun;

        // Glow layer for realistic star effect
        const glowLayer = new BABYLON.GlowLayer('glow', scene);
        glowLayer.intensity = 0.6;

        // Planet with PBR material
        const planet = BABYLON.MeshBuilder.CreateSphere("planet", { diameter: 2, segments: 16 }, scene);
        const planetMat = new BABYLON.PBRMaterial("planetMat", scene);
        planetMat.albedoColor = new BABYLON.Color3(0.3, 0.6, 1);
        planetMat.metallic = 0.3;
        planetMat.roughness = 0.7;
        planet.material = planetMat;
        planetRef.current = planet;

        // Trail mesh for orbital path (N-body visualization)
        const trail = new BABYLON.TrailMesh("trail", planet, scene, () => planet.getPosition(), 500, 0.5);
        const trailMat = new BABYLON.StandardMaterial("trailMat", scene);
        trailMat.emissiveColor = new BABYLON.Color3(0.2, 0.5, 1);
        trailMat.disableLighting = true;
        trail.material = trailMat;
        trailRef.current = trail;

        // Gravity well grid visualization
        const gravityGrid = BABYLON.MeshBuilder.CreateGround("gravityGrid", { width: 200, height: 200 }, scene);
        const gridMat = new BABYLON.GridMaterial("gridMat", scene);
        gridMat.majorUnitFrequency = 10;
        gridMat.minorUnitVisibility = 0.3;
        gridMat.gridRatio = 10;
        gridMat.opacity = 0.3;
        gridMat.backFaceCulling = false;
        gravityGrid.position.y = -0.5;

        // Physics constants for N-body simulation
        const G = 100; // Gravitational constant (scaled)
        const sunMass = 1000;
        const planetMass = settings?.mass || 1;

        // Initial conditions based on settings
        const initialDistance = settings?.initialDistance || 40;
        const initialVelocity = settings?.velocity || 8;
        const eccentricity = settings?.eccentricity || 0.3;

        // Calculate elliptical orbit parameters
        const semiMajorAxis = initialDistance;
        const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity ** 2);
        
        let planetPosition = new BABYLON.Vector3(semiMajorAxis, 0, 0);
        let planetVelocity = new BABYLON.Vector3(0, initialVelocity, 0);
        planet.position.copyFrom(planetPosition);

        // Kepler's law tracking
        let totalTime = 0;
        let areaSwept = 0;
        let lastPosition = planetPosition.clone();
        let orbitStartTime = Date.now();

        // Animation loop with N-body gravity solver
        scene.registerBeforeRender(() => {
            const dt = engine.getDeltaTime() / 1000; // Delta time in seconds

            if (isRunning) {
                // Calculate gravitational force: F = G * m1 * m2 / r^2
                const r = BABYLON.Vector3.Distance(planetPosition, BABYLON.Vector3.Zero());
                const forceMagnitude = (G * sunMass * planetMass) / (r * r);

                // Direction toward sun (center)
                const direction = BABYLON.Vector3.Zero().subtract(planetPosition).normalize();
                const force = direction.scale(forceMagnitude);

                // Acceleration: a = F/m (Runge-Kutta integration)
                const acceleration = force.scale(1 / planetMass);

                // Update velocity
                planetVelocity = planetVelocity.add(acceleration.scale(dt));

                // Update position
                lastPosition = planetPosition.clone();
                planetPosition = planetPosition.add(planetVelocity.scale(dt));
                planet.position.copyFrom(planetPosition);

                // Calculate area swept for Kepler's 2nd law
                const crossProduct = BABYLON.Vector3.Cross(lastPosition, planetPosition);
                areaSwept += 0.5 * Math.abs(crossProduct.z);
                totalTime += dt;

                // Send telemetry data
                if (onTelemetry) {
                    const velocity = planetVelocity.length();
                    const distance = r;
                    
                    // Estimate orbital period from area sweep rate
                    const totalArea = Math.PI * semiMajorAxis * semiMinorAxis;
                    const areaRate = areaSwept / totalTime;
                    const estimatedPeriod = areaRate > 0 ? totalArea / areaRate : 0;

                    telemetryRef.current = {
                        velocity: velocity.toFixed(2),
                        distance: distance.toFixed(2),
                        areaSwept: areaSwept.toFixed(2),
                        gravitationalForce: forceMagnitude.toFixed(2),
                        orbitalPeriod: estimatedPeriod.toFixed(2),
                        semiMajorAxis: semiMajorAxis.toFixed(2),
                        eccentricity: eccentricity.toFixed(2)
                    };

                    onTelemetry(telemetryRef.current);
                }
            }
        });

        engine.runRenderLoop(() => {
            scene.render();
        });

        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            scene.dispose();
            engine.dispose();
        };
    }, [settings, isRunning, triggerReset, onTelemetry]);

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && lazyGuide && <EduOverlay lazyGuide={lazyGuide} />}
            
            {/* Kepler's Laws Info Panel */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <h3 className="font-bold mb-2 text-blue-400">Kepler's Laws Visualization</h3>
                <div className="space-y-1">
                    <p>🔹 1st Law: Elliptical Orbits</p>
                    <p>🔹 2nd Law: Equal Areas in Equal Time</p>
                    <p>🔹 3rd Law: T² ∝ a³</p>
                </div>
                {telemetryRef.current.distance && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                        <p>Distance: {telemetryRef.current.distance}m</p>
                        <p>Velocity: {telemetryRef.current.velocity} m/s</p>
                        <p>Force: {telemetryRef.current.gravitationalForce}N</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrbitalSim;
