import * as BABYLON from '@babylonjs/core';

export const createLabEnvironment = (scene, options = {}) => {
    const {
        gridSize = 40,
        groundColor = new BABYLON.Color3(0.02, 0.03, 0.05),
        gridColor = new BABYLON.Color3(0.08, 0.12, 0.18),
        showGrid = true,
        showAxis = false
    } = options;

    // Ground with custom material
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { 
        width: gridSize * 2, 
        height: gridSize * 2,
        subdivisions: 1
    }, scene);
    
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = groundColor;
    groundMat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.03);
    groundMat.emissiveColor = new BABYLON.Color3(0.01, 0.015, 0.02);
    ground.material = groundMat;

    // Grid lines
    if (showGrid) {
        const gridLines = [];
        const step = 2;
        
        for (let i = -gridSize; i <= gridSize; i += step) {
            // X lines
            gridLines.push([
                new BABYLON.Vector3(i, 0.01, -gridSize),
                new BABYLON.Vector3(i, 0.01, gridSize)
            ]);
            // Z lines
            gridLines.push([
                new BABYLON.Vector3(-gridSize, 0.01, i),
                new BABYLON.Vector3(gridSize, 0.01, i)
            ]);
        }

        gridLines.forEach((points, idx) => {
            const line = BABYLON.MeshBuilder.CreateLines("gridLine" + idx, { points }, scene);
            line.color = gridColor;
            line.alpha = 0.4;
        });
    }

    // Axis indicator
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
    const { intensity = 0.8, color = new BABYLON.Color3(0.9, 0.95, 1) } = options;

    // Ambient hemisphere light
    const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = intensity * 0.6;
    hemiLight.diffuse = color;
    hemiLight.groundColor = new BABYLON.Color3(0.05, 0.08, 0.12);

    // Key light (point)
    const keyLight = new BABYLON.PointLight("keyLight", new BABYLON.Vector3(10, 15, 10), scene);
    keyLight.intensity = intensity * 0.4;
    keyLight.diffuse = color;

    // Rim light for depth
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
        panningEnabled = true
    } = options;

    const camera = new BABYLON.ArcRotateCamera("camera", alpha, beta, radius, target, scene);
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
    
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

export const createLabSkybox = (scene) => {
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.01, 0.015, 0.02);
    skybox.material = skyboxMaterial;
    
    return skybox;
};

export const enableWebXR = async (scene) => {
    try {
        const xrHelper = await scene.createDefaultXRExperienceAsync({
            floorMeshes: [scene.getMeshByName("ground")]
        });
        return xrHelper;
    } catch (e) {
        console.warn("WebXR not supported or failed to initialize", e);
        return null;
    }
};