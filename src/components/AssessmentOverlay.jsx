import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

const AssessmentOverlay = ({ topic, onComplete }) => {
    const [step, setStep] = useState(0);
    const [selected, setSelected] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);

    // Mock assessment questions (these would ideally be AI-generated)
    const questions = [
        {
            q: `In the ${topic} simulation, what primary factor determines the final outcome?`,
            options: ['Initial Velocity', 'Mass of Object', 'External Forces', 'Mathematical Constant'],
            ans: 2
        },
        {
            q: "If we doubled the scale of this experiment, how would the energy transfer change?",
            options: ['It would stay the same', 'It would double', 'It would quadruple', 'It would be halved'],
            ans: 1
        }
    ];

    const handleCheck = () => {
        if (selected === questions[step].ans) {
            setIsCorrect(true);
        } else {
            setIsCorrect(false);
        }
    };

    const next = () => {
        if (step < questions.length - 1) {
            setStep(s => s + 1);
            setSelected(null);
            setIsCorrect(null);
        } else {
            onComplete();
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.progress}>Question {step + 1} of {questions.length}</div>
                <h3 style={styles.question}>{questions[step].q}</h3>

                <div style={styles.options}>
                    {questions[step].options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => setSelected(i)}
                            style={{
                                ...styles.option,
                                borderColor: selected === i ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                backgroundColor: selected === i ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <div style={styles.footer}>
                    {isCorrect === null ? (
                        <button
                            disabled={selected === null}
                            onClick={handleCheck}
                            style={{...styles.btn, opacity: selected === null ? 0.5 : 1}}
                        >
                            Check Answer
                        </button>
                    ) : (
                        <div style={styles.resultRow}>
                            <div style={{ color: isCorrect ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                {isCorrect ? 'Correct! Great observation.' : 'Not quite. Review the theory!'}
                            </div>
                            <button onClick={next} style={styles.nextBtn}>
                                {step < questions.length - 1 ? 'Next Question' : 'Finish Lab'} <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'absolute', inset: 0, background: 'rgba(2, 4, 8, 0.85)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
    card: { width: '100%', maxWidth: '500px', background: '#0a0c12', border: '1px solid #1e293b', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
    progress: { fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '1px' },
    question: { fontSize: '18px', fontWeight: '600', marginBottom: '25px', lineHeight: '1.4' },
    options: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' },
    option: { padding: '15px', borderRadius: '12px', border: '1px solid', color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' },
    footer: { borderTop: '1px solid #1e293b', paddingTop: '25px' },
    btn: { width: '100%', background: '#3b82f6', border: 'none', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
    resultRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    nextBtn: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }
};

export default AssessmentOverlay;