import * as BABYLON from '@babylonjs/core';

export const triggerExplosion = (scene, position) => {
    const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
    particleSystem.particleTexture = new BABYLON.Texture("https://models.babylonjs.com/Demos/Weapons/flare.png", scene);

    particleSystem.emitter = position;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);

    particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(1, 0.2, 0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);

    particleSystem.minSize = 0.5;
    particleSystem.maxSize = 2.0;

    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.0;

    particleSystem.emitRate = 1500;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    particleSystem.direction1 = new BABYLON.Vector3(-2, 8, 2);
    particleSystem.direction2 = new BABYLON.Vector3(2, 8, -2);

    particleSystem.minEmitPower = 5;
    particleSystem.maxEmitPower = 10;
    particleSystem.updateSpeed = 0.01;

    particleSystem.targetStopDuration = 0.2;
    particleSystem.disposeOnStop = true;

    particleSystem.start();
};

export const shakeCamera = (camera, scene) => {
    const animation = new BABYLON.Animation(
        "shake",
        "radius",
        60,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const initialRadius = camera.radius;
    const keys = [
        { frame: 0, value: initialRadius },
        { frame: 5, value: initialRadius - 2 },
        { frame: 10, value: initialRadius + 2 },
        { frame: 15, value: initialRadius - 1 },
        { frame: 20, value: initialRadius + 1 },
        { frame: 25, value: initialRadius }
    ];

    animation.setKeys(keys);
    camera.animations = [animation];
    scene.beginAnimation(camera, 0, 25, false);
};