import React from 'react';
import { Target, Activity, Beaker, FlaskConical, Wind, Clock, ArrowDown, Link2, Waves, Zap, Plug, Eye, Magnet, Globe, Microscope, Mountain, TreeDeciduous, ThermometerSun } from 'lucide-react';

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
const ElectromagneticSim = React.lazy(() => import('../simulations/ElectromagneticSim'));
const ChemistrySim = React.lazy(() => import('../simulations/ChemistrySim'));
const CellSim = React.lazy(() => import('../simulations/CellSim'));
const PhotosynthesisSim = React.lazy(() => import('../simulations/PhotosynthesisSim'));
const TectonicsSim = React.lazy(() => import('../simulations/TectonicsSim'));
const ClimateSim = React.lazy(() => import('../simulations/ClimateSim'));

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
                theory: 'Projectile motion is the curved path an object follows when thrown near Earth\'s surface. Real-world application: Engineers use these calculations to design sports equipment like golf clubs and tennis rackets. It is also essential for predicting the landing of space capsules returning to Earth and for firefighting teams aiming water cannons at high-rise buildings.',
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
                theory: 'Newton\'s Second Law states that force equals mass times acceleration. Real-world application: Automotive engineers apply this to calculate necessary braking force and design crumple zones. It also explains why heavier trucks require longer distances to stop than smaller cars, which directly influences speed limits and road safety regulations worldwide.',
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
                theory: 'A pendulum oscillates with a period determined primarily by its length and gravity. Real-world application: Beyond clocks, pendulums are used in "tuned mass dampers" inside skyscrapers like Taipei 101 to counteract swaying from high winds or earthquakes. They also help geologists measure local gravity variations to find oil or mineral deposits underground.',
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
                theory: 'In a vacuum, all objects fall at the same rate. Real-world application: Skydivers use body positioning to alter drag and reach a "terminal velocity" of about 120 mph. NASA engineers use these same principles to design parachutes and heat shields for rovers landing on Mars, where the atmosphere is much thinner than Earth\'s.',
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
                theory: 'Hooke\'s Law states that restoring force is proportional to displacement. Real-world application: This principle is the foundation of vehicle suspension systems, ensuring a smooth ride. It is also used in force-sensing industrial robots, weighing scales, and even in the design of earthquake-resistant foundations for bridges.',
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
                theory: 'Interference occurs when waves overlap. Real-world application: Destructive interference is the technology behind noise-canceling headphones, which "cancel" external noise with opposite sound waves. In telecommunications, interference patterns are used in "phased array" antennas to beam internet signals directly to your phone without wasting energy in other directions.',
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
                theory: 'The Doppler effect is the change in frequency when a source moves relative to an observer. Real-world application: Medical Doppler ultrasound measures blood flow velocity to detect heart issues. Police use it in radar guns to catch speeding drivers, and astronomers use "Redshift" to prove that the entire universe is expanding away from us.',
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
                theory: 'Circuits follow Ohm\'s Law (V=IR). Real-world application: Your home is wired in parallel so one failing bulb doesn\'t turn off the whole house. Electronics designers use series circuits inside devices to create voltage dividers, which allow a single battery to power components that require different voltage levels, like a screen and a processor.',
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
                theory: 'Light bends when entering materials of different densities. Real-world application: This is how eyeglasses and contact lenses correct vision. It is also the core principle of fiber optic cables; by using "total internal reflection," light can carry high-speed internet data across oceans through thin glass strands with zero loss of signal.',
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
                theory: 'Magnetic fields represent areas of magnetic force. Real-world application: MRI machines use massive magnetic fields to image the human body. Migratory birds and sea turtles use Earth\'s natural magnetic field lines as a "biological GPS" to navigate thousands of miles across the ocean without getting lost.',
                difficulty: 2,
                sims: ['magnet drag', 'field lines', 'compass needle'],
                initialConfig: { separation: 10, orientation: 'N-N', fieldLines: 8, compassX: 5 }
            },
            {
                id: 'ELECTROMAGNETIC_INDUCTION',
                title: 'Electromagnetic Induction',
                icon: Zap,
                component: ElectromagneticSim,
                description: 'Move a coil through a magnetic field; induce a current.',
                theory: 'A changing magnetic field induces electric current. Real-world application: This is how 99% of the world\'s electricity is generated in hydro, wind, and nuclear plants. It is also the technology behind wireless phone chargers, induction stovetops, and regenerative braking in electric cars like Teslas, which turn motion back into battery power.',
                difficulty: 3,
                sims: ['galvanometer', 'flux change', 'coil speed'],
                initialConfig: { velocity: 5, turns: 10, fieldStrength: 5 }
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
                id: 'CHEM_TITRATION',
                title: 'Acid-Base Titration',
                icon: FlaskConical,
                component: ChemistrySim,
                description: 'Study neutralization through titration and indicator color changes.',
                theory: 'Titration reacts a known solution with an unknown to find its concentration. Real-world application: Food scientists use titration to check the quality of milk and the acidity of wine. It is also used by environmental scientists to measure "acid rain" damage in lakes and by water treatment plants to ensure drinking water is safe and neutral.',
                difficulty: 2,
                sims: ['pH curve', 'indicator', 'molarity'],
                initialConfig: { acidVolume: 25, acidConcentration: 0.1, baseConcentration: 0.1 }
            }
        ]
    },
    {
        id: 'BIOLOGY',
        title: 'Biology',
        icon: Microscope,
        color: '#f59e0b',
        description: 'Discover the building blocks of life and ecosystems.',
        experiments: [
            {
                id: 'CELL_STRUCTURE',
                title: 'Cell Explorer',
                icon: Microscope,
                component: CellSim,
                description: 'Explore the 3D structure of plant and animal cells.',
                theory: 'Cells are the fundamental units of life. Real-world application: Understanding organelles is vital for medical researchers developing "mRNA" vaccines and targeted cancer therapies. It also helps bioengineers use yeast or bacteria to "grow" medicine like insulin or sustainable alternatives to plastic and leather.',
                difficulty: 1,
                sims: ['organelle zoom', 'structure toggle', 'ID markers'],
                initialConfig: { cellType: 'animal', labelDetail: 'high' }
            },
            {
                id: 'PHOTOSYNTHESIS',
                title: 'Photosynthesis Lab',
                icon: TreeDeciduous,
                component: PhotosynthesisSim,
                description: 'Observe how light intensity and CO2 affect glucose production.',
                theory: 'Photosynthesis converts sunlight into chemical energy. Real-world application: This is the foundation of "Vertical Farming," where crops are grown indoors under LED lights to save water and land. Scientists are also researching "Artificial Photosynthesis" to create carbon-neutral fuels that could power planes and ships without polluting the air.',
                difficulty: 2,
                sims: ['light intensity', 'CO2 levels', 'gas meter'],
                initialConfig: { lightIntensity: 50, co2Level: 400 }
            }
        ]
    },
    {
        id: 'GEOGRAPHY',
        title: 'Geography',
        icon: Globe,
        color: '#8b5cf6',
        description: 'Understand Earth\'s physical processes and landscapes.',
        experiments: [
            {
                id: 'PLATE_TECTONICS',
                title: 'Plate Tectonics',
                icon: Mountain,
                component: TectonicsSim,
                description: 'Simulate plate boundaries and volcanic activity.',
                theory: 'Earth\'s lithosphere is divided into plates moving over the mantle. Real-world application: Geologists use plate movement data to create earthquake hazard maps and early warning systems for tsunamis. This science also explains the location of precious metal deposits (like gold and copper), which often form near ancient plate boundaries.',
                difficulty: 2,
                sims: ['boundary type', 'stress meter', 'fault lines'],
                initialConfig: { plateType: 'convergent', subductionSpeed: 5 }
            },
            {
                id: 'CLIMATE_PATTERNS',
                title: 'Climate & Seasons',
                icon: ThermometerSun,
                component: ClimateSim,
                description: 'Visualize Earth\'s axial tilt and its impact on seasons.',
                theory: 'Earth\'s axial tilt (23.5 degrees) causes seasonal variations in sunlight. Real-world application: Architects use this to design "Passive Solar" homes that use the sun\'s seasonal angle to stay warm in winter and cool in summer. It also helps farmers predict growing seasons and allows satellite operators to plan orbits that keep solar panels pointed at the sun.',
                difficulty: 1,
                sims: ['tilt angle', 'orbit speed', 'insolation map'],
                initialConfig: { tilt: 23.5, month: 'June' }
            }
        ]
    }
];