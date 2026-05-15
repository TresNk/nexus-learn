import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { RotateCcw, ArrowLeft, BookOpen, Target, AlertTriangle, Info } from 'lucide-react';
import { calculatePrediction } from '../hooks/useSimulation';
import ErrorBoundary from './ErrorBoundary';
import { useSafeSimulation } from '../hooks/useSafeSimulation';
import TheoryModal from './TheoryModal';

const LabStage = ({ activeExp, config, setConfig, isRunning, setIsRunning, resetKey, setResetKey, onBack, onUpdate, subjectColor, failedSims, onSimError }) => {
    const [eduMode, setEduMode] = useState(true);
    const [theoryOpen, setTheoryOpen] = useState(false);
    const [predictionMode, setPredictionMode] = useState(false);
    const [userPrediction, setUserPrediction] = useState('');
    const [predictionResult, setPredictionResult] = useState(null);
    const [simError, setSimError] = useState(false);
    
    const { error: safeError, resetError, clearError } = useSafeSimulation(activeExp?.title);

    const isFailed = failedSims?.some(f => f.id === activeExp?.id);

    const expectedValue = useMemo(() => {
        if (activeExp && activeExp.id && config) {
            return calculatePrediction(activeExp.id, config);
        }
        return null;
    }, [activeExp, config]);

    const handleRun = () => {
        if (isFailed) return;
        setSimError(false);
        resetError();
        
        if (predictionMode && userPrediction && expectedValue) {
            const predicted = parseFloat(userPrediction);
            const expected = parseFloat(expectedValue.value);
            const diff = Math.abs(expected - predicted);
            const accuracy = diff < expected * 0.1 ? 'excellent' : diff < expected * 0.25 ? 'good' : 'needs work';
            setPredictionResult({ expected, predicted, diff, accuracy });
        } else {
            setPredictionResult(null);
        }
        setIsRunning(true);
    };

    const handleReset = () => {
        setIsRunning(false);
        setResetKey(k => k + 1);
        setPredictionResult(null);
        setSimError(false);
        clearError();
    };

    const handleError = useCallback((error) => {
        console.error('[LabStage] Simulation error caught:', error);
        setSimError(true);
        if (onSimError && activeExp) {
            onSimError(activeExp.id, error?.message || 'Unknown error');
        }
    }, [onSimError, activeExp]);

    const handleRetry = () => {
        setSimError(false);
        clearError();
        handleReset();
    };

    if (isFailed) {
        return (
            <main style={{ flex: 1, position: 'relative', height: '100vh', width: '100%', background: '#000', overflow: 'hidden' }}>
                <button onClick={onBack} style={styles.backBtn}>
                    <ArrowLeft size={16} /> EXIT LAB
                </button>
                <div style={styles.failedContainer}>
                    <div style={styles.failedIcon}>⚠️</div>
                    <div style={styles.failedTitle}>Simulation Unavailable</div>
                    <div style={styles.failedMessage}>
                        "{activeExp?.title}" encountered an error and couldn't be loaded.
                    </div>
                    <div style={styles.failedActions}>
                        <button onClick={onBack} style={styles.backToDashBtn}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={{ flex: 1, position: 'relative', height: '100vh', width: '100%', background: '#000', overflow: 'hidden' }}>
            <button onClick={onBack} style={styles.backBtn}>
                <ArrowLeft size={16} /> EXIT LAB
            </button>

            {(simError || safeError) && (
                <div style={styles.errorBanner}>
                    <AlertTriangle size={16} />
                    <span>
                        {safeError?.message || 'Simulation encountered an issue. You can adjust parameters and try again.'}
                    </span>
                    <button onClick={handleRetry} style={styles.retryLink}>Retry</button>
                </div>
            )}

            <div style={styles.topBar}>
                <button 
                    onClick={() => setEduMode(!eduMode)}
                    style={{...styles.topBtn, ...(eduMode ? styles.topBtnActive : {})}}
                >
                    <BookOpen size={14} /> {eduMode ? 'Hide Edu' : 'Show Edu'}
                </button>
                <button 
                    onClick={() => setPredictionMode(!predictionMode)}
                    style={{...styles.topBtn, ...(predictionMode ? styles.topBtnActive : {})}}
                >
                    <Target size={14} /> {predictionMode ? 'Predict On' : 'Predict Off'}
                </button>

                <button
                    onClick={() => setTheoryOpen(true)}
                    style={{...styles.topBtn, color: '#f59e0b'}}
                >
                    <Info size={14} /> Why? (Theory)
                </button>
                
                {predictionMode && expectedValue && (
                    <div style={styles.predictionBox}>
                        <div style={styles.expectedLabel}>Expected: {expectedValue.value} {expectedValue.unit}</div>
                        <input
                            type="number"
                            value={userPrediction}
                            onChange={(e) => setUserPrediction(e.target.value)}
                            placeholder={`Your ${expectedValue.label.toLowerCase()} prediction`}
                            style={styles.predInput}
                        />
                        {predictionResult && (
                            <div style={{
                                ...styles.predResult,
                                color: predictionResult.accuracy === 'excellent' ? '#10b981' : predictionResult.accuracy === 'good' ? '#fbbf24' : '#ef4444'
                            }}>
                                {predictionResult.accuracy === 'excellent' ? '✓ Excellent!' : predictionResult.accuracy === 'good' ? '△ Close' : '✗ Try again'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <TheoryModal
                isOpen={theoryOpen}
                onClose={() => setTheoryOpen(false)}
                topic={activeExp?.title}
                content={activeExp?.theory || (activeExp?.description + ". This simulation follows standard scientific principles taught in high school curricula. Use the controls below to observe real-time data changes.")}
            />

            <div style={{ width: '100%', height: '100%' }}>
                <ErrorBoundary 
                    fallback={<ErrorFallback simulationName={activeExp?.title} onRetry={handleRetry} />}
                    simulationName={activeExp?.title}
                >
                    <Suspense fallback={
                        <div style={styles.loader}>
                            <div style={styles.loaderSpinner}></div>
                            <div>Initializing {activeExp?.title}...</div>
                        </div>
                    }>
                        <activeExp.component
                            key={activeExp.id + "_" + resetKey}
                            settings={config}
                            isRunning={isRunning}
                            onUpdate={onUpdate}
                            onImpact={() => {
                                setIsRunning(false);
                            }}
                            onError={handleError}
                            eduMode={eduMode}
                        />
                    </Suspense>
                </ErrorBoundary>
            </div>

            <div style={styles.hud}>
                {Object.keys(config).map(key => (
                    <div key={key} style={styles.inputGroup}>
                        <span style={styles.label}>{key.toUpperCase()}</span>
                        <input
                            type="number"
                            value={config[key]}
                            onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })}
                            style={styles.input}
                        />
                    </div>
                ))}
                <button onClick={handleRun} style={{ ...styles.btn, backgroundColor: subjectColor }}>
                    {predictionMode ? 'PREDICT & RUN' : 'EXECUTE'}
                </button>
                <button onClick={handleReset} style={styles.resetBtn}>
                    <RotateCcw size={18} />
                </button>
            </div>
        </main>
    );
};

const ErrorFallback = ({ simulationName, onRetry }) => (
    <div style={styles.errorFallback}>
        <div style={styles.errorIcon}>⚠️</div>
        <div style={styles.errorTitle}>Simulation Unavailable</div>
        <div style={styles.errorMessage}>
            "{simulationName}" is temporarily unavailable.
        </div>
        <div style={styles.errorActions}>
            <button onClick={onRetry} style={styles.retryBtn}>Try Again</button>
            <button onClick={() => window.location.reload()} style={styles.reloadBtn}>Refresh</button>
        </div>
    </div>
);

const styles = {
    loader: { 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#3b82f6', 
        fontSize: '18px',
        gap: '15px'
    },
    loaderSpinner: {
        width: '40px',
        height: '40px',
        border: '3px solid rgba(59, 130, 246, 0.2)',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    errorBanner: {
        position: 'absolute',
        top: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        color: '#ef4444',
        padding: '10px 20px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12px',
    },
    retryLink: {
        background: 'transparent',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        textDecoration: 'underline',
    },
    failedContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
    },
    failedIcon: {
        fontSize: '48px',
        marginBottom: '20px',
    },
    failedTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: '10px',
    },
    failedMessage: {
        fontSize: '14px',
        marginBottom: '20px',
    },
    failedActions: {
        display: 'flex',
        gap: '10px',
    },
    backToDashBtn: {
        background: 'rgba(59, 130, 246, 0.2)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        color: '#3b82f6',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    backBtn: { position: 'absolute', top: '20px', left: '20px', zIndex: 1000, backgroundColor: 'rgba(5, 10, 20, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    topBar: { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '80%' },
    topBtn: { background: 'rgba(5, 10, 20, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' },
    topBtnActive: { background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)', color: '#3b82f6' },
    predictionBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(10, 15, 25, 0.9)', padding: '8px 15px', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.3)' },
    expectedLabel: { fontSize: '11px', color: '#10b981', fontWeight: 'bold' },
    predInput: { background: 'transparent', border: 'none', color: '#fbbf24', padding: '4px 8px', width: '120px', fontSize: '12px', outline: 'none' },
    predResult: { fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' },
    hud: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '30px', padding: '20px 40px', backgroundColor: 'rgba(5,10,20,0.8)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 100, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '85%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '10px', color: '#3b82f6', fontWeight: '800', letterSpacing: '0.5px' },
    input: { background: 'rgba(0,0,0,0.5)', border: '1px solid #1e293b', color: 'white', padding: '10px 12px', borderRadius: '12px', width: '70px', outline: 'none', fontSize: '13px', transition: 'border-color 0.2s' },
    btn: { border: 'none', padding: '14px 30px', color: 'white', borderRadius: '14px', cursor: 'pointer', fontWeight: '800', fontSize: '13px', letterSpacing: '0.5px', transition: 'transform 0.2s, filter 0.2s' },
    resetBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', color: '#64748b', borderRadius: '14px', cursor: 'pointer', transition: 'color 0.2s, background 0.2s' },
    
    errorFallback: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#010204',
        color: '#94a3b8',
        fontFamily: 'monospace',
        padding: '40px',
    },
    errorIcon: {
        fontSize: '64px',
        marginBottom: '20px',
    },
    errorTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: '15px',
    },
    errorMessage: {
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '25px',
    },
    errorActions: {
        display: 'flex',
        gap: '15px',
    },
    retryBtn: {
        background: 'rgba(59, 130, 246, 0.2)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        color: '#3b82f6',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    reloadBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#64748b',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
    },
};

export default LabStage;