/**
 * NexusCreator Component
 *
 * Provides a "Sandbox" environment for users to define and deploy custom scientific simulations.
 * It uses a schema-based approach where users define parameters and logic which are then
 * interpreted by the GenericSimulation engine.
 */
import React, { useState } from 'react';
import { X, Play, Save, Plus, Trash2, Layout, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import GenericSimulation from '../simulations/GenericSimulation';

const NexusCreator = ({ onSave, onCancel }) => {
    const [draft, setDraft] = useState(() => ({
        id: 'DRAFT_' + Date.now(),
        title: 'New Mechanism',
        subject: 'MECHANICS',
        description: 'Describe your simulation here...',
        theory: 'Explain the scientific or engineering principles...',
        formula: 'v = d / t',
        initialConfig: { speed: 10, mass: 5 },
        difficulty: 1
    }));

    const [activeTab, setActiveTab] = useState('INFO');
    const [previewMode, setPreviewMode] = useState(false);

    const updateConfig = (key, value) => {
        setDraft(prev => ({
            ...prev,
            initialConfig: { ...prev.initialConfig, [key]: value }
        }));
    };

    const addConfigField = () => {
        const fieldName = prompt("Enter parameter name (e.g., 'friction', 'voltage'):");
        if (fieldName) {
            updateConfig(fieldName, 1);
        }
    };

    const removeConfigField = (key) => {
        const newConfig = { ...draft.initialConfig };
        delete newConfig[key];
        setDraft(prev => ({ ...prev, initialConfig: newConfig }));
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} className="glass-panel">
                <header style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.logo}>C</div>
                        <h2 style={{ margin: 0 }}>NEXUS <span style={{ color: '#fbbf24' }}>CREATOR</span></h2>
                    </div>
                    <button onClick={onCancel} style={styles.closeBtn}><X size={20} /></button>
                </header>

                <div style={styles.content}>
                    <aside style={styles.nav}>
                        <button
                            onClick={() => setActiveTab('INFO')}
                            style={{...styles.tab, ...(activeTab === 'INFO' ? styles.tabActive : {})}}
                        >
                            <Layout size={16} /> Basic Info
                        </button>
                        <button
                            onClick={() => setActiveTab('THEORY')}
                            style={{...styles.tab, ...(activeTab === 'THEORY' ? styles.tabActive : {})}}
                        >
                            <BookOpen size={16} /> Theory & Logic
                        </button>
                        <button
                            onClick={() => setActiveTab('SIM')}
                            style={{...styles.tab, ...(activeTab === 'SIM' ? styles.tabActive : {})}}
                        >
                            <SettingsIcon size={16} /> Parameters
                        </button>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={() => setPreviewMode(!previewMode)} style={styles.previewBtn}>
                                <Play size={16} /> {previewMode ? 'Edit Mode' : 'Live Preview'}
                            </button>
                            <button onClick={() => onSave(draft)} style={styles.saveBtn}>
                                <Save size={16} /> Deploy Draft
                            </button>
                        </div>
                    </aside>

                    <main style={styles.main}>
                        {previewMode ? (
                            <div style={styles.previewContainer}>
                                <GenericSimulation
                                    settings={draft.initialConfig}
                                    isRunning={true}
                                    onUpdate={() => {}}
                                />
                                <div style={styles.previewBadge}>SANDBOX PREVIEW</div>
                            </div>
                        ) : (
                            <div style={styles.editor}>
                                {activeTab === 'INFO' && (
                                    <div style={styles.formSection}>
                                        <label style={styles.label}>EXPERIMENT TITLE</label>
                                        <input
                                            style={styles.input}
                                            value={draft.title}
                                            onChange={e => setDraft({...draft, title: e.target.value})}
                                            aria-label="EXPERIMENT TITLE"
                                        />

                                        <label style={styles.label}>CATEGORY / FIELD</label>
                                        <select
                                            style={styles.input}
                                            value={draft.subject}
                                            onChange={e => setDraft({...draft, subject: e.target.value})}
                                            aria-label="CATEGORY / FIELD"
                                        >
                                            <option value="PHYSICS">Physics</option>
                                            <option value="CHEMISTRY">Chemistry</option>
                                            <option value="BIOLOGY">Biology</option>
                                            <option value="GEOGRAPHY">Geography</option>
                                            <option value="MECHANICS">Mechanics</option>
                                            <option value="ELECTRONICS">Electronics</option>
                                            <option value="QUANTUM">Quantum Computing</option>
                                        </select>

                                        <label style={styles.label}>SHORT DESCRIPTION</label>
                                        <textarea
                                            style={{...styles.input, height: '100px'}}
                                            value={draft.description}
                                            onChange={e => setDraft({...draft, description: e.target.value})}
                                        />
                                    </div>
                                )}

                                {activeTab === 'THEORY' && (
                                    <div style={styles.formSection}>
                                        <label style={styles.label}>THEORETICAL CONTEXT & REAL-WORLD APPLICATIONS</label>
                                        <textarea
                                            style={{...styles.input, height: '200px', fontFamily: 'serif'}}
                                            value={draft.theory}
                                            onChange={e => setDraft({...draft, theory: e.target.value})}
                                            placeholder="Markdown supported. Explain the 'Why' behind this simulation..."
                                        />

                                        <label style={styles.label}>PRIMARY SCIENTIFIC FORMULA</label>
                                        <input
                                            style={styles.input}
                                            value={draft.formula}
                                            onChange={e => setDraft({...draft, formula: e.target.value})}
                                            placeholder="e.g. F = ma or V = IR"
                                        />
                                    </div>
                                )}

                                {activeTab === 'SIM' && (
                                    <div style={styles.formSection}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <label style={styles.label}>SIMULATION PARAMETERS (INPUTS)</label>
                                            <button onClick={addConfigField} style={styles.addFieldBtn}>
                                                <Plus size={14} /> Add Parameter
                                            </button>
                                        </div>

                                        <div style={styles.paramGrid}>
                                            {Object.entries(draft.initialConfig).map(([key, value]) => (
                                                <div key={key} style={styles.paramCard}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={styles.paramKey}>{key.toUpperCase()}</span>
                                                        <Trash2
                                                            size={14}
                                                            color="#ef4444"
                                                            style={{cursor: 'pointer'}}
                                                            onClick={() => removeConfigField(key)}
                                                        />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        style={styles.paramInput}
                                                        value={value}
                                                        onChange={e => updateConfig(key, Number(e.target.value))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
    modal: { width: '100%', maxWidth: '1200px', height: '85vh', backgroundColor: '#0a0c12', borderRadius: '24px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { padding: '20px 30px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { width: '30px', height: '30px', backgroundColor: '#fbbf24', borderRadius: '8px', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' },
    content: { flex: 1, display: 'flex', overflow: 'hidden' },
    nav: { width: '240px', borderRight: '1px solid #1e293b', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
    tab: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', textAlign: 'left', fontSize: '14px', transition: 'all 0.2s' },
    tabActive: { background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' },
    main: { flex: 1, overflowY: 'auto', padding: '40px', position: 'relative' },
    editor: { maxWidth: '800px', margin: '0 auto' },
    formSection: { display: 'flex', flexDirection: 'column', gap: '15px' },
    label: { fontSize: '11px', fontWeight: 'bold', color: '#3b82f6', letterSpacing: '1px' },
    input: { background: '#020408', border: '1px solid #1e293b', borderRadius: '12px', padding: '15px', color: 'white', outline: 'none', fontSize: '14px' },
    previewContainer: { height: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid #3b82f644', position: 'relative' },
    previewBadge: { position: 'absolute', top: '20px', right: '20px', background: '#fbbf24', color: 'black', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' },
    saveBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' },
    previewBtn: { background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    addFieldBtn: { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
    paramGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' },
    paramCard: { background: '#020408', border: '1px solid #1e293b', padding: '15px', borderRadius: '12px' },
    paramKey: { fontSize: '10px', color: '#64748b' },
    paramInput: { background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#10b981', width: '100%', marginTop: '10px', outline: 'none', fontSize: '16px', fontWeight: 'bold' }
};

export default NexusCreator;
