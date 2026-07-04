import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createLabEnvironment, createLabLighting, createLabCamera } from '../utils/labEnvironment';
import { triggerExplosion, shakeCamera } from '../utils/vfx';
import { playImpactSound } from '../utils/audio';
import EduOverlay from '../components/EduOverlay';

const ProjectileSim = ({ settings, onUpdate, isRunning, onImpact, eduMode = true }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const ballRef = useRef(null);
    const towerRef = useRef(null);
    const barrelRef = useRef(null);
    const trailRef = useRef(null);
    const velocityArrowRef = useRef(null);
    const pointsRef = useRef([]);
    const time = useRef(0);
    const [annotations, setAnnotations] = useState([]);
    const [livePhysicsData, setLivePhysicsData] = useState(null);

    const h0_val = Number(settings.height);
    const angleRad = (Number(settings.angle) * Math.PI) / 180;
    const v0 = Number(settings.velocity);
    const vx = v0 * Math.cos(angleRad);
    const vy_init = v0 * Math.sin(angleRad);
    const muzzleX = 3 * Math.cos(angleRad);
    const muzzleY = h0_val + 2.5 + 3 * Math.sin(angleRad);
    const maxTime = (vy_init + Math.sqrt(vy_init * vy_init + 2 * 9.8 * (h0_val + 2.5))) / 9.8;

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.4, 0.6, 0.9, 1);

        const envPreset = 'OUTDOOR';
        createLabEnvironment(scene, { preset: envPreset, gridSize: 100, showGrid: true });
        createLabLighting(scene, { preset: envPreset, intensity: 1.0 });
        createLabCamera(scene, new BABYLON.Vector3(25, 12, 0), { radius: 60 });

        engineRef.current = engine;
        sceneRef.current = scene;

        engine.runRenderLoop(() => scene.render());

        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        if (towerRef.current) towerRef.current.dispose();
        if (barrelRef.current) barrelRef.current.dispose();
        if (ballRef.current) ballRef.current.dispose();
        if (trailRef.current) { trailRef.current.dispose(); trailRef.current = null; }
        if (velocityArrowRef.current) { velocityArrowRef.current.dispose(); velocityArrowRef.current = null; }

        const tower = BABYLON.MeshBuilder.CreateBox("tower", { width: 4, height: h0_val, depth: 4 }, scene);
        tower.position.y = h0_val / 2;
        const tMat = new BABYLON.StandardMaterial("tm", scene);
        tMat.diffuseColor = new BABYLON.Color3(0.15, 0.18, 0.25);
        tower.material = tMat;
        towerRef.current = tower;

        const barrel = BABYLON.MeshBuilder.CreateCylinder("barrel", { diameter: 2.2, height: 6 }, scene);
        barrel.rotation.z = angleRad - Math.PI / 2;
        barrel.position.y = h0_val + 2.5;
        const bMat = new BABYLON.StandardMaterial("bm", scene);
        bMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 1.0);
        barrel.material = bMat;
        barrelRef.current = barrel;

        const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 1.5 }, scene);
        const sMat = new BABYLON.StandardMaterial("sm", scene);
        sMat.diffuseColor = new BABYLON.Color3(1, 0.4, 0);
        ball.material = sMat;
        ballRef.current = ball;
        ball.position = new BABYLON.Vector3(muzzleX, muzzleY, 0);

        time.current = 0;
        pointsRef.current = [];

        onUpdate({
            x: muzzleX.toFixed(1),
            y: muzzleY.toFixed(1),
            vx: vx.toFixed(1),
            vy: vy_init.toFixed(1),
            t: "0.0"
        });
    }, [h0_val, angleRad, muzzleX, muzzleY, vx, vy_init, onUpdate]);

    const getAnnotation = React.useCallback((t, x, y, curVx, curVy, initialH) => {
        const annList = [
            { threshold: 0.5, text: `Initial velocity: ${curVx.toFixed(1)} m/s horizontal, ${vy_init.toFixed(1)} m/s vertical` },
            { threshold: 1.5, text: `Gravity reducing vertical speed: vy = ${curVy.toFixed(1)} m/s` },
            { threshold: 2.5, text: `Ball at peak height: ${y.toFixed(1)}m. Vertical velocity = 0` },
            { threshold: 4.5, text: `Approaching ground: total speed = ${Math.sqrt(curVx*curVx + curVy*curVy).toFixed(1)} m/s (from ${initialH}m)` },
        ];
        const match = annList.find(a => t >= a.threshold) || { text: `Position: (${x.toFixed(1)}, ${y.toFixed(1)})m` };
        return { t: `t=${t.toFixed(1)}s`, text: match.text };
    }, [vy_init]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !isRunning) return;

        const g = -9.8;
        let lastAnnotationTime = 0;

        const physicsStep = () => {
            if (isRunning && ballRef.current && ballRef.current.position.y > 0) {
                time.current += 0.016;
                const posX = muzzleX + (vx * time.current);
                const posY = muzzleY + (vy_init * time.current) + (0.5 * g * Math.pow(time.current, 2));
                const currentVy = vy_init + g * time.current;

                ballRef.current.position.x = posX;
                ballRef.current.position.y = Math.max(0, posY);

                setLivePhysicsData({
                    x: posX,
                    y: posY,
                    vx: vx,
                    vy: currentVy,
                    t: time.current
                });

                pointsRef.current.push(ballRef.current.position.clone());
                if (pointsRef.current.length > 2) {
                    if (trailRef.current) trailRef.current.dispose();
                    trailRef.current = BABYLON.MeshBuilder.CreateLines("t", { points: pointsRef.current }, scene);
                    trailRef.current.color = new BABYLON.Color3(1, 0.7, 0);
                }

                if (velocityArrowRef.current) velocityArrowRef.current.dispose();
                const arrowLength = Math.sqrt(vx * vx + currentVy * currentVy) / 5;
                const arrowDir = new BABYLON.Vector3(vx / arrowLength, currentVy / arrowLength, 0).normalize();
                const arrowEnd = ballRef.current.position.add(arrowDir.scale(arrowLength));
                velocityArrowRef.current = BABYLON.MeshBuilder.CreateLines("velArrow", {
                    points: [ballRef.current.position.add(new BABYLON.Vector3(0, 0.75, 0)), arrowEnd.add(new BABYLON.Vector3(0, 0.75, 0))]
                }, scene);
                velocityArrowRef.current.color = new BABYLON.Color3(0.2, 1, 0.4);

                onUpdate({
                    x: posX.toFixed(1),
                    y: posY.toFixed(1),
                    vx: vx.toFixed(1),
                    vy: currentVy.toFixed(1),
                    t: time.current.toFixed(1)
                });

                if (time.current - lastAnnotationTime > 0.5 && time.current < maxTime) {
                    lastAnnotationTime = time.current;
                    const annotation = getAnnotation(time.current, posX, posY, vx, currentVy, h0_val);
                    setAnnotations(prev => [...prev.slice(-2), annotation]);
                }

                if (ballRef.current.position.y <= 0) {
                    ballRef.current.position.y = 0;
                    onImpact();
                }
            }
        };

        scene.onBeforeRenderObservable.add(physicsStep);
        return () => scene.onBeforeRenderObservable.removeCallback(physicsStep);
    }, [isRunning, muzzleX, muzzleY, vx, vy_init, onUpdate, maxTime, getAnnotation, h0_val, onImpact]);

    const displayTime = isRunning && livePhysicsData ? livePhysicsData.t : 0;

    const eduData = {
        formula: "y = h₀ + v₀sin(θ)t - ½gt²",
        variables: {
            "h₀": `${h0_val}m`,
            "v₀": `${v0} m/s`,
            "θ": `${settings.angle}°`,
            "g": "9.81 m/s²",
            "t": `${displayTime.toFixed(2)}s`
        },
        annotations: annotations,
        lazyGuide
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#010204', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }} />
            {eduMode && <EduOverlay {...eduData} />}
        </div>
    );
};

export default ProjectileSim;