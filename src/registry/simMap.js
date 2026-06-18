import React from 'react';
import { Target, Activity, Beaker, FlaskConical, Wind, Clock, ArrowDown, Link2, Waves, Zap, Plug, Eye, Magnet } from 'lucide-react';

const ProjectileSim = React.lazy(() => import('../simulations/ProjectileSim'));
const DynamicsSim = React.lazy(() => import('../simulations/DynamicsSim'));
const PendulumSim = React.lazy(() => import('../simulations/PendulumSim'));
const FreeFallSim = React.lazy(() => import('../simulations/FreeFallSim'));
const SpringSim = React.lazy(() => import('../simulations/SpringSim'));
const WaveInterferenceSim = React.lazy(() => import('../simulations/WaveInterferenceSim'));
const DopplerSim = React.lazy(() => import('../simulations/DopplerSim'));
const CircuitSim = React.lazy(() => import('../simulations/CircuitSim'));
const RefractionSim = React.lazy(() => import('../simulations/RefractionSim'));
const MagneticFieldSim = React.lazy(() => import('../simulations/MagneticFieldSim'));

export const SUBJECTS = [
    {
        id: 'PHYSICS',
        title: 'Physics',
        icon: Wind,
        color: '#3b82f6',
        description: 'Master the laws of the universe, from motion to energy.',
        experiments: [
            {
                id: 'KINEMATICS_PROJ',
                title: 'Projectile Motion',
                icon: Target,
                component: ProjectileSim,
                description: 'Study 2D kinematics and parabolic flight paths.',
                difficulty: 1,
                sims: ['trajectory', 'range calc', 'angle slider'],
                initialConfig: { velocity: 30, angle: 45, height: 10 }
            },
            {
                id: 'DYNAMICS_NEWTON',
                title: "Newton's Second Law",
                icon: Activity,
                component: DynamicsSim,
                description: 'Explore Force, Mass, and Acceleration (F=ma).',
                difficulty: 1,
                sims: ['force arrow', 'a=F/m', 'friction toggle'],
                initialConfig: { mass: 10, force: 50 }
            },
            {
                id: 'PENDULUM_MOTION',
                title: 'Pendulum Motion',
                icon: Clock,
                component: PendulumSim,
                description: 'Adjust length and mass; watch period change in real time.',
                difficulty: 1,
                sims: ['drag release', 'timer', 'graph'],
                initialConfig: { length: 8, angle: 45 }
            },
            {
                id: 'FREE_FALL',
                title: 'Free Fall & Gravity',
                icon: ArrowDown,
                component: FreeFallSim,
                description: 'Drop objects from height; compare with and without air resistance.',
                difficulty: 1,
                sims: ['drop timer', 'drag toggle', 'v-t graph'],
                initialConfig: { height: 30, mass: 1, drag: false }
            },
            {
                id: 'HOOKES_LAW',
                title: "Hooke's Law / Springs",
                icon: Link2,
                component: SpringSim,
                description: 'Stretch a spring and measure the restoring force.',
                difficulty: 1,
                sims: ['spring stretch', 'k slider', 'force graph'],
                initialConfig: { k: 20, mass: 2, displacement: 3 }
            },
            {
                id: 'WAVE_INTERFERENCE',
                title: 'Wave Interference',
                icon: Waves,
                component: WaveInterferenceSim,
                description: 'Two wave sources produce constructive and destructive patterns.',
                difficulty: 2,
                sims: ['dual source', 'frequency knob', 'nodal lines'],
                initialConfig: { frequency: 1, separation: 16, amplitude: 1 }
            },
            {
                id: 'DOPPLER_EFFECT',
                title: 'Doppler Effect',
                icon: Zap,
                component: DopplerSim,
                description: 'Move a sound source; watch wavelength compress and stretch.',
                difficulty: 2,
                sims: ['moving source', 'speed slider', 'pitch meter'],
                initialConfig: { speed: 10, frequency: 2 }
            },
            {
                id: 'SIMPLE_CIRCUITS',
                title: 'Simple Circuits',
                icon: Plug,
                component: CircuitSim,
                description: 'Build series and parallel circuits; measure voltage and current.',
                difficulty: 2,
                sims: ['circuit builder', "Ohm's law", 'multimeter'],
                initialConfig: { voltage: 12, r1: 10, r2: 20, config: 'series' }
            },
            {
                id: 'REFRACTION_SNELL',
                title: 'Refraction & Snells Law',
                icon: Eye,
                component: RefractionSim,
                description: 'Shine a ray through two media; adjust angle and index.',
                difficulty: 2,
                sims: ['ray tracer', 'n slider', 'critical angle'],
                initialConfig: { angle: 45, n1: 1.0, n2: 1.5 }
            },
            {
                id: 'MAGNETIC_FIELD',
                title: 'Magnetic Field Lines',
                icon: Magnet,
                component: MagneticFieldSim,
                description: 'Place bar magnets and visualise field lines around them.',
                difficulty: 2,
                sims: ['magnet drag', 'field lines', 'compass needle'],
                initialConfig: { separation: 10, orientation: 'N-N', fieldLines: 8, compassX: 5 }
            }
        ]
    },
    {
        id: 'CHEMISTRY',
        title: 'Chemistry',
        icon: Beaker,
        color: '#10b981',
        description: 'Explore atomic structures and chemical reactions.',
        experiments: [
            {
                id: 'ATOMIC_BONDS',
                title: 'Ionic Bonding',
                icon: FlaskConical,
                component: ChemistrySim,
                description: 'Understand how atoms share or trade electrons.',
                difficulty: 1,
                sims: ['bond builder', 'electronegativity', '3D model'],
                initialConfig: { atoms: 2 }
            }
        ]
    }
];