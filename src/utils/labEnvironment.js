import * as BABYLON from '@babylonjs/core';

export const createLabEnvironment = (scene, options = {}) => {
    const {
        preset = 'LAB_DARK',
        gridSize = 40,
        showGrid = true,
        showAxis = false
    } = options;

    let groundColor, gridColor, emissiveColor;

    switch (preset) {
        case 'FIELD':
        case 'OUTDOOR':
            groundColor = new BABYLON.Color3(0.1, 0.35, 0.1);
            gridColor = new BABYLON.Color3(0.2, 0.5, 0.2);
            emissiveColor = new BABYLON.Color3(0.02, 0.05, 0.02);
            break;
        case 'LAB_WHITE':
            groundColor = new BABYLON.Color3(0.95, 0.95, 0.98);
            gridColor = new BABYLON.Color3(0.8, 0.8, 0.85);
            emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            break;
        case 'WATER':
            groundColor = new BABYLON.Color3(0.01, 0.1, 0.15);
            gridColor = new BABYLON.Color3(0.05, 0.25, 0.3);
            emissiveColor = new BABYLON.Color3(0.01, 0.05, 0.08);
            break;
        case 'SPACE':
            groundColor = new BABYLON.Color3(0, 0, 0);
            gridColor = new BABYLON.Color3(0.1, 0.1, 0.2);
            emissiveColor = new BABYLON.Color3(0, 0, 0);
            break;
        case 'ATOMIC':
        case 'MICROSCOPIC':
            groundColor = new BABYLON.Color3(0.05, 0.01, 0.1);
            gridColor = new BABYLON.Color3(0.2, 0.05, 0.3);
            emissiveColor = new BABYLON.Color3(0.02, 0, 0.05);
            break;
        case 'LAB_DARK':
        default:
            groundColor = new BABYLON.Color3(0.02, 0.03, 0.05);
            gridColor = new BABYLON.Color3(0.08, 0.12, 0.18);
            emissiveColor = new BABYLON.Color3(0.01, 0.015, 0.02);
            break;
    }

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { 
        width: gridSize * 2, 
        height: gridSize * 2,
        subdivisions: 1
    }, scene);
    
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = groundColor;
    groundMat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.03);
    groundMat.emissiveColor = emissiveColor;
    ground.material = groundMat;

    if (showGrid) {
        const gridLines = [];
        const step = 2;
        
        for (let i = -gridSize; i <= gridSize; i += step) {
            gridLines.push([
                new BABYLON.Vector3(i, 0.01, -gridSize),
                new BABYLON.Vector3(i, 0.01, gridSize)
            ]);
            gridLines.push([
                new BABYLON.Vector3(-gridSize, 0.01, i),
                new BABYLON.Vector3(gridSize, 0.01, i)
            ]);
        }

        gridLines.forEach((points, idx) => {
            const line = BABYLON.MeshBuilder.CreateLines("gridLine" + idx, { points }, scene);
            line.color = gridColor;
            line.alpha = preset === 'LAB_WHITE' ? 0.2 : 0.4;
        });
    }

    if (showAxis) {
        const axisX = BABYLON.MeshBuilder.CreateLines("axisX", {
            points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(5, 0, 0)]
        }, scene);
        axisX.color = new BABYLON.Color3(1, 0.3, 0.3);

        const axisY = BABYLON.MeshBuilder.CreateLines("axisY", {
            points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 5, 0)]
        }, scene);
        axisY.color = new BABYLON.Color3(0.3, 1, 0.3);

        const axisZ = BABYLON.MeshBuilder.CreateLines("axisZ", {
            points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 5)]
        }, scene);
        axisZ.color = new BABYLON.Color3(0.3, 0.3, 1);
    }

    return { ground };
};

export const createLabLighting = (scene, options = {}) => {
    const {
        intensity = 0.8,
        color = new BABYLON.Color3(0.9, 0.95, 1),
        preset = 'LAB_DARK'
    } = options;

    const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = intensity * 0.6;
    hemiLight.diffuse = color;

    if (preset === 'OUTDOOR' || preset === 'FIELD') {
        hemiLight.groundColor = new BABYLON.Color3(0.2, 0.4, 0.1);
        hemiLight.intensity = intensity * 0.8;
    } else if (preset === 'LAB_WHITE') {
        hemiLight.intensity = intensity * 0.9;
    } else if (preset === 'SPACE') {
        hemiLight.intensity = intensity * 0.4;
    } else if (preset === 'ATOMIC') {
        hemiLight.diffuse = new BABYLON.Color3(0.8, 0.5, 1);
        hemiLight.intensity = intensity * 0.5;
    } else {
        hemiLight.groundColor = new BABYLON.Color3(0.05, 0.08, 0.12);
    }

    const keyLight = new BABYLON.PointLight("keyLight", new BABYLON.Vector3(10, 15, 10), scene);
    keyLight.intensity = intensity * 0.4;
    keyLight.diffuse = color;

    const rimLight = new BABYLON.PointLight("rimLight", new BABYLON.Vector3(-10, 10, -10), scene);
    rimLight.intensity = intensity * 0.2;
    rimLight.diffuse = new BABYLON.Color3(0.4, 0.6, 1);

    return { hemiLight, keyLight, rimLight };
};

export const createLabCamera = (scene, target = BABYLON.Vector3.Zero(), options = {}) => {
    const {
        alpha = -Math.PI / 2,
        beta = Math.PI / 3,
        radius = 25,
        lowerRadiusLimit = 5,
        upperRadiusLimit = 100,
        panningEnabled = true,
        pinchPrecision = 12,
        wheelPrecision = 12
    } = options;

    const camera = new BABYLON.ArcRotateCamera("camera", alpha, beta, radius, target, scene);
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
    
    camera.pinchPrecision = pinchPrecision;
    camera.wheelPrecision = wheelPrecision;
    camera.allowUpsideDown = false;

    camera.lowerRadiusLimit = lowerRadiusLimit;
    camera.upperRadiusLimit = upperRadiusLimit;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2.1;
    
    if (panningEnabled) {
        camera.panningSensibility = 500;
        camera.useCtrlForPanning = false;
        camera.panningInertia = 0.9;
    }

    return camera;
};

export const createGlowMaterial = (scene, color, intensity = 0.5) => {
    const mat = new BABYLON.StandardMaterial("glowMat", scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color.scale(intensity);
    mat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    return mat;
};

export const createLabSkybox = (scene, options = {}) => {
    const { preset = 'LAB_DARK' } = options;
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    
    switch (preset) {
        case 'FIELD':
        case 'OUTDOOR':
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);
            skyboxMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
            break;
        case 'LAB_WHITE':
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
            skyboxMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            break;
        case 'SPACE':
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.emissiveColor = new BABYLON.Color3(0.01, 0.01, 0.02);
            break;
        case 'ATOMIC':
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0.02, 0, 0.05);
            skyboxMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.01, 0.1);
            break;
        case 'LAB_DARK':
        default:
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.emissiveColor = new BABYLON.Color3(0.01, 0.015, 0.02);
            break;
    }

    skybox.material = skyboxMaterial;
    return skybox;
};

// WebXR support for VR/AR experiences
export const enableWebXR = async (scene) => {
    try {
        // Check if WebXR is supported
        if (!BABYLON.WebXRDefaultExperience) {
            console.warn('WebXR not available in this environment');
            return null;
        }

        // Create default XR experience with teleportation and movement
        const xr = await scene.createDefaultXRExperienceAsync({
            floorMeshes: [scene.getMeshByName('ground')].filter(Boolean),
            uiOptions: {
                sessionMode: 'immersive-vr',
                referenceSpaceType: 'local-floor'
            },
            inputOptions: {
                enablePointerSelection: true
            }
        });

        // Add hand tracking support for Quest devices
        if (xr.inputManager) {
            xr.inputManager.onControllerAddedObservable.add((controller) => {
                console.log('XR Controller connected:', controller);
            });
        }

        console.log('WebXR enabled successfully');
        return xr;
    } catch (error) {
        console.warn('Failed to enable WebXR:', error.message);
        return null;
    }
};
