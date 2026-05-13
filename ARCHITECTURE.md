# Nexus Learn: Technical Architecture & Scaling Roadmap

## 1. System Overview
Nexus Learn is an AI-augmented educational platform designed for high-fidelity scientific simulations. It bridges the gap between theoretical learning and interactive 3D exploration.

## 2. Core Components

### A. Registry-Driven Architecture (`src/registry/`)
- **SafeRegistry.js**: Acts as the system's "Operating System." It handles the dynamic injection of simulations, validates schemas for AI-generated content, and manages the state of custom user-created labs.
- **simMap.js**: The primary library containing 27+ core simulations across Physics, Chemistry, Biology, and Geography.

### B. The Execution Engine (`src/components/`)
- **LabStage.jsx**: The host environment for all experiments. It provides the "Edu-First" UI, including prediction inputs, real-world application theory modals, and telemetry HUDs.
- **GenericSimulation.jsx**: A schema-driven 3D engine built on Babylon.js. It interprets configuration objects (mass, speed, shape, color) to render interactive models without requiring custom code for every experiment.

### C. The Nexus Creator Sandbox
- A dedicated workspace for users to define their own scientific mechanisms. It generates a "Logic Schema" that the Generic Engine then visualizes.

## 3. Structural Patterns
- **Isolation of Concerns**: Educational UI (React) is decoupled from Physics Logic (Babylon.js).
- **Remount-on-Reset**: Uses dynamic React keys to ensure full disposal of WebGL contexts, preventing memory leaks.
- **Lazy Loading**: High-fidelity modules are loaded on-demand to minimize initial bundle size.

## 4. Current Capacity
- **Curriculum Coverage**: High School to Early Undergraduate (Kinematics, Thermodynamics, Molecular Biology, Tectonics, etc.).
- **Visuals**: High-fidelity 3D rendering with 360-degree interactive camera controls.
- **Intelligence**: Real-time contextual tutoring via Google Gemini 1.5 Flash.

## 5. Scaling Roadmap

### Phase 1: Community & Cloud
- Integrate a backend (e.g., Supabase) to allow users to publish and share "Creator" simulations in a global library.

### Phase 2: Advanced Physics & Logic
- Implement a visual "Node Editor" for the Nexus Creator to allow for complex variable relationships (e.g., `if speed > 10 then change color`).
- Integrate Ammo.js or Cannon.js for full rigid-body dynamics.

### Phase 3: Immersive Learning
- **WebXR Integration**: Enable VR/AR modes for compatible headsets and mobile devices.
- **Collaborative Labs**: Multi-user synchronization for remote classroom instruction.
