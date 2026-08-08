import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    schemaVersion: { type: Number, default: 1 }, // For migration tracking
    completedSims: [{
        simId: String,
        completedAt: Date,
        score: Number,
        attempts: Number
    }],
    knowledgeState: {
        physics: { type: Map, of: Number, default: {} }, // Bayesian Knowledge Tracing values
        chemistry: { type: Map, of: Number, default: {} },
        biology: { type: Map, of: Number, default: {} },
        geography: { type: Map, of: Number, default: {} }
    },
    masteryLevels: {
        physics: { type: Number, default: 0, min: 0, max: 100 },
        chemistry: { type: Number, default: 0, min: 0, max: 100 },
        biology: { type: Number, default: 0, min: 0, max: 100 },
        geography: { type: Number, default: 0, min: 0, max: 100 }
    },
    learningPath: [{
        simId: String,
        recommendedAt: Date,
        difficulty: Number,
        status: { type: String, enum: ['pending', 'in-progress', 'completed'] }
    }],
    preferences: {
        theme: { type: String, default: 'dark' },
        accessibility: {
            screenReaderMode: { type: Boolean, default: false },
            highContrast: { type: Boolean, default: false }
        }
    },
    lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Migration middleware - auto-updates old documents
userProgressSchema.pre('save', function(next) {
    const doc = this;
    
    // Migration to v1: Add schema version and initialize new fields
    if (!doc.schemaVersion || doc.schemaVersion < 1) {
        console.log(`Migrating user ${doc.userId} from v${doc.schemaVersion || 0} to v1`);
        
        // Initialize knowledgeState if missing
        if (!doc.knowledgeState) {
            doc.knowledgeState = {
                physics: new Map(),
                chemistry: new Map(),
                biology: new Map(),
                geography: new Map()
            };
        }
        
        // Initialize masteryLevels if missing
        if (!doc.masteryLevels) {
            doc.masteryLevels = {
                physics: 0,
                chemistry: 0,
                biology: 0,
                geography: 0
            };
        }
        
        // Convert old completedSims format if needed
        if (doc.completedSims && Array.isArray(doc.completedSims)) {
            doc.completedSims = doc.completedSims.map(sim => ({
                simId: sim.simId || sim.id,
                completedAt: sim.completedAt || sim.date || new Date(),
                score: sim.score || 0,
                attempts: sim.attempts || 1
            }));
        }
        
        // Initialize learningPath if missing
        if (!doc.learningPath) {
            doc.learningPath = [];
        }
        
        // Initialize preferences if missing
        if (!doc.preferences) {
            doc.preferences = {
                theme: 'dark',
                accessibility: {
                    screenReaderMode: false,
                    highContrast: false
                }
            };
        }
        
        doc.schemaVersion = 1;
    }
    
    // Update lastActive timestamp
    doc.lastActive = new Date();
    
    next();
});

// Index for efficient queries
userProgressSchema.index({ userId: 1 });
userProgressSchema.index({ 'knowledgeState.physics': 1 });
userProgressSchema.index({ lastActive: 1 });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

export default UserProgress;
