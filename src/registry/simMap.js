import React from 'react';
import { Target, Activity, Beaker, FlaskConical, Wind, Clock, ArrowDown, Link2, Waves, Zap, Plug, Eye, Magnet, Globe, Microscope, Mountain, TreeDeciduous, ThermometerSun, Orbit, Atom, Scale, Dna, Copy, Heart, CloudRain, Gem, Hexagon } from 'lucide-react';

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
const CircularMotionSim = React.lazy(() => import('../simulations/CircularMotionSim'));
const GasLawsSim = React.lazy(() => import('../simulations/GasLawsSim'));
const ChemistrySim = React.lazy(() => import('../simulations/ChemistrySim'));
const AtomicStructureSim = React.lazy(() => import('../simulations/AtomicStructureSim'));
const MolecularSim = React.lazy(() => import('../simulations/MolecularSim'));
const EquilibriumSim = React.lazy(() => import('../simulations/EquilibriumSim'));
const CellSim = React.lazy(() => import('../simulations/CellSim'));
const PhotosynthesisSim = React.lazy(() => import('../simulations/PhotosynthesisSim'));
const DnaSim = React.lazy(() => import('../simulations/DnaSim'));
const MitosisSim = React.lazy(() => import('../simulations/MitosisSim'));
const HeartSim = React.lazy(() => import('../simulations/HeartSim'));
const TectonicsSim = React.lazy(() => import('../simulations/TectonicsSim'));
const ClimateSim = React.lazy(() => import('../simulations/ClimateSim'));
const WaterCycleSim = React.lazy(() => import('../simulations/WaterCycleSim'));
const RockCycleSim = React.lazy(() => import('../simulations/RockCycleSim'));
const RiverSim = React.lazy(() => import('../simulations/RiverSim'));

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
                initialConfig: { velocity: 30, angle: 45, height: 10 },
                challenge: {
                    title: 'Precision Strike',
                    parameter: 'range',
                    target: 100,
                    unit: 'm',
                    threshold: 0.05
                }
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
                initialConfig: { mass: 10, force: 50 },
                challenge: {
                    title: 'Constant Acceleration',
                    parameter: 'acceleration',
                    target: 5,
                    unit: 'm/s²',
                    threshold: 0.05
                }
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
                initialConfig: { length: 8, angle: 45 },
                challenge: {
                    title: 'Slow Rhythm',
                    parameter: 'period',
                    target: 4,
                    unit: 's',
                    threshold: 0.02
                }
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
            },
            {
                id: 'CIRCULAR_MOTION',
                title: 'Circular Motion',
                icon: Orbit,
                component: CircularMotionSim,
                description: 'Explore centripetal force and orbital velocity.',
                theory: 'Objects in circular motion require a centripetal force acting toward the center. Real-world application: Satellites stay in orbit due to the balance of gravity and their velocity. Highway engineers design banked curves so cars can safely navigate turns at high speeds without skidding.',
                difficulty: 2,
                sims: ['orbital path', 'force vector', 'radius slider'],
                initialConfig: { radius: 10, velocity: 5, mass: 2 }
            },
            {
                id: 'GAS_LAWS',
                title: 'Gas Laws (P-V-T)',
                icon: Wind,
                component: GasLawsSim,
                description: 'Simulate Boyle\'s and Charles\'s laws with molecular kinetic theory.',
                theory: 'The Ideal Gas Law (PV=nRT) relates pressure, volume, and temperature. Real-world application: Scuba divers must understand Boyle\'s law to avoid "the bends." Car tires and aerosol cans include warnings about heat because pressure increases with temperature.',
                difficulty: 2,
                sims: ['piston', 'temp slider', 'collision counter'],
                initialConfig: { volume: 50, temperature: 300, particles: 50 }
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
            },
            {
                id: 'ATOMIC_STRUCTURE',
                title: 'Atomic Structure',
                icon: Atom,
                component: AtomicStructureSim,
                description: 'Build atoms with protons, neutrons, and electrons.',
                theory: 'Atoms are composed of a central nucleus orbited by electrons in specific energy shells. Real-world application: Semi-conductors in your smartphone rely on the movement of electrons between these energy levels. Nuclear medicine uses isotopes (atoms with extra neutrons) for life-saving cancer treatments.',
                difficulty: 1,
                sims: ['shell filler', 'isotope calc', 'stability meter'],
                initialConfig: { protons: 6, neutrons: 6, electrons: 6 }
            },
            {
                id: 'MOLECULAR_GEOMETRY',
                title: 'Molecular Geometry',
                icon: Hexagon,
                component: MolecularSim,
                description: 'Explore VSEPR theory and 3D molecular shapes.',
                theory: 'Molecules take specific shapes to minimize electron repulsion. Real-world application: The "lock and key" mechanism of drugs in the human body depends entirely on molecular shape. Water\'s "bent" shape is the reason it can dissolve so many substances and why ice floats.',
                difficulty: 2,
                sims: ['shape viewer', 'bond angle', 'polarity'],
                initialConfig: { molecule: 'H2O' }
            },
            {
                id: 'CHEM_EQUILIBRIUM',
                title: 'Chemical Equilibrium',
                icon: Scale,
                component: EquilibriumSim,
                description: 'Observe Le Chatelier\'s principle in a reversible reaction.',
                theory: 'Systems at equilibrium respond to stress by shifting to counteract it. Real-world application: The Haber process uses these principles to produce fertilizer for half the world\'s food supply. Your blood maintains a constant pH using equilibrium buffers that respond to CO2 levels.',
                difficulty: 3,
                sims: ['conc shift', 'temp effect', 'k_eq graph'],
                initialConfig: { temp: 298, concentrationA: 1.0, concentrationB: 0.0 }
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
            },
            {
                id: 'DNA_STRUCTURE',
                title: 'DNA Double Helix',
                icon: Dna,
                component: DnaSim,
                description: 'Interact with the 3D structure of genetic information.',
                theory: 'DNA stores biological instructions in a twisted ladder shape made of base pairs. Real-world application: CRISPR gene editing allows scientists to fix mutations directly in the DNA. Forensic scientists use specific DNA patterns to solve crimes with incredible accuracy.',
                difficulty: 1,
                sims: ['base pair zoom', 'replication', 'mutation tool'],
                initialConfig: { sequence: 'ATGC', zoom: 1 }
            },
            {
                id: 'MITOSIS_STAGES',
                title: 'Cell Division (Mitosis)',
                icon: Copy,
                component: MitosisSim,
                description: 'Watch the stages of a cell cloning itself.',
                theory: 'Mitosis is how somatic cells divide into two identical daughter cells. Real-world application: Wound healing and skin regeneration depend on constant mitosis. Cancer is essentially mitosis that has gone out of control, making this study vital for oncology.',
                difficulty: 2,
                sims: ['phase slider', 'chromosome view', 'checkpoints'],
                initialConfig: { speed: 1, currentPhase: 'interphase' }
            },
            {
                id: 'HUMAN_HEART',
                title: 'Human Heart / Circulation',
                icon: Heart,
                component: HeartSim,
                description: 'Explore the 3D anatomy and pumping cycle of the heart.',
                theory: 'The heart is a double-pump system moving blood through pulmonary and systemic loops. Real-world application: Pacemakers use electrical signals to correct heart rhythms. Understanding flow dynamics helps surgeons design artificial heart valves and stents.',
                difficulty: 3,
                sims: ['valve cam', 'bpm slider', 'oxygenation view'],
                initialConfig: { bpm: 72, view: 'interior' }
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
            },
            {
                id: 'WATER_CYCLE',
                title: 'The Water Cycle',
                icon: CloudRain,
                component: WaterCycleSim,
                description: 'Trace a water molecule through Earth\'s atmosphere and surface.',
                theory: 'Water moves through evaporation, condensation, and precipitation in a closed system. Real-world application: Predicting floods and droughts depends on accurate cycle modeling. Desalination plants use these principles to create drinking water from the ocean.',
                difficulty: 1,
                sims: ['heat source', 'precip slider', 'groundwater'],
                initialConfig: { heat: 50, humidity: 60 }
            },
            {
                id: 'ROCK_CYCLE',
                title: 'Rock Cycle & Geology',
                icon: Gem,
                component: RockCycleSim,
                description: 'Transform rocks through heat, pressure, and time.',
                theory: 'Rocks continuously change between igneous, sedimentary, and metamorphic states. Real-world application: Civil engineers must understand rock types to build stable skyscrapers and tunnels. The fossil fuels that power modern life are found only in specific layers of sedimentary rock.',
                difficulty: 2,
                sims: ['magma chamber', 'erosion', 'pressure tool'],
                initialConfig: { depth: 10, pressure: 50, temperature: 500 }
            },
            {
                id: 'RIVER_DYNAMICS',
                title: 'River Dynamics / Erosion',
                icon: Waves,
                component: RiverSim,
                description: 'Simulate how rivers shape the landscape through erosion.',
                theory: 'Rivers move sediment based on velocity and volume, creating meanders and deltas. Real-world application: Cities like New Orleans or Venice rely on meander management for flood protection. Agricultural irrigation depends on understanding silt deposition patterns.',
                difficulty: 2,
                sims: ['gradient slider', 'flow rate', 'sediment load'],
                initialConfig: { slope: 5, flow: 100 }
            }
        ]
    }
];