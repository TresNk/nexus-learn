import React from 'react';

const EduOverlay = ({ 
  formula, 
  variables, 
  predictions, 
  actuals,
  vectors,
  annotations,
  lazyGuide,
  showFormula = true,
  showPrediction = true,
  showVectors = true,
  showAnnotations = true
}) => {
  return (
    <div style={styles.container}>
      {/* Lazy Guide Panel */}
      {lazyGuide && (
        <div style={styles.lazyGuidePanel}>
          <div style={styles.panelTitle}>THE "LAZY" GUIDE</div>
          <div style={styles.lazyGuideText}>{lazyGuide}</div>
        </div>
      )}

      {/* Formula Panel */}
      {showFormula && formula && (
        <div style={styles.formulaPanel}>
          <div style={styles.panelTitle}>FORMULA</div>
          <div style={styles.formula}>{formula}</div>
          <div style={styles.variables}>
            {Object.entries(variables || {}).map(([key, value]) => (
              <div key={key} style={styles.variable}>
                <span style={styles.varName}>{key}:</span>
                <span style={styles.varValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prediction vs Actual */}
      {showPrediction && predictions && (
        <div style={styles.predictionPanel}>
          <div style={styles.panelTitle}>PREDICTION</div>
          {Object.entries(predictions).map(([key, value]) => (
            <div key={key} style={styles.predictionRow}>
              <span style={styles.predLabel}>{key}:</span>
              <span style={styles.predValue}>{value}</span>
            </div>
          ))}
          {actuals && Object.keys(actuals).length > 0 && (
            <div style={styles.comparison}>
              <div style={styles.comparisonTitle}>ACTUAL</div>
              {Object.entries(actuals).map(([key, value]) => {
                const pred = predictions[key];
                const diff = pred ? Math.abs(parseFloat(pred) - parseFloat(value)).toFixed(2) : null;
                return (
                  <div key={key} style={styles.actualRow}>
                    <span style={styles.actLabel}>{key}:</span>
                    <span style={styles.actValue}>{value}</span>
                    {diff && <span style={styles.diff}>{diff > 0.1 ? `Δ${diff}` : '✓'}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Live Annotations */}
      {showAnnotations && annotations && annotations.length > 0 && (
        <div style={styles.annotationPanel}>
          {annotations.map((ann, i) => (
            <div key={i} style={styles.annotation}>
              <span style={styles.annTime}>{ann.t}</span>
              <span style={styles.annText}>{ann.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 100,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  formulaPanel: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'rgba(10, 15, 25, 0.9)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '12px',
    padding: '15px',
    maxWidth: '350px',
  },
  panelTitle: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#3b82f6',
    letterSpacing: '0.1em',
    marginBottom: '10px',
  },
  lazyGuidePanel: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '12px',
    padding: '15px',
    pointerEvents: 'auto',
  },
  lazyGuideText: {
    fontSize: '13px',
    color: '#34d399',
    fontStyle: 'italic',
    lineHeight: '1.4'
  },
  formula: {
    fontSize: '16px',
    color: '#e2e8f0',
    marginBottom: '12px',
    padding: '10px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    textAlign: 'center',
    fontFamily: "'Times New Roman', serif",
    fontStyle: 'italic',
  },
  variables: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  variable: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  varName: {
    color: '#94a3b8',
  },
  varValue: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  predictionPanel: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(10, 15, 25, 0.9)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '12px',
    padding: '15px',
    maxWidth: '250px',
  },
  predictionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '12px',
  },
  predLabel: {
    color: '#94a3b8',
  },
  predValue: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  comparison: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  comparisonTitle: {
    fontSize: '10px',
    color: '#10b981',
    marginBottom: '8px',
  },
  actualRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '12px',
  },
  actLabel: {
    color: '#94a3b8',
  },
  actValue: {
    color: '#e2e8f0',
  },
  diff: {
    color: '#ef4444',
    fontSize: '10px',
    marginLeft: '8px',
  },
  annotationPanel: {
    position: 'absolute',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '500px',
    width: '100%',
    alignItems: 'center',
  },
  annotation: {
    background: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    borderRadius: '20px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    animation: 'fadeIn 0.3s ease',
  },
  annTime: {
    fontSize: '10px',
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  annText: {
    fontSize: '12px',
    color: '#e2e8f0',
  },
};

export default EduOverlay;