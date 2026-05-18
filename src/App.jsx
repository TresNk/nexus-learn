import React, { useState } from 'react';
import { SUBJECTS } from './registry/simMap';
import LabStage from './components/LabStage';
import { getNexusResponse, generateSimulationConfig } from './services/aiService';
import { BrainCircuit, LayoutDashboard, Send, Loader2, Sparkles, PlusSquare } from 'lucide-react';
import { useSafeRegistry } from './registry/SafeRegistry';
import NexusCreator from './components/NexusCreator';
import TelemetryGraph from './components/TelemetryGraph';

function App() {
  const [view, setView] = useState('DASHBOARD');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [activeExp, setActiveExp] = useState(null);
  const [config, setConfig] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [liveData, setLiveData] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const { subjects, addGeneratedSim, failedSims, markFailed, clearFailed, addCreatorSim } = useSafeRegistry(SUBJECTS);

  // --- CHAT STATE ---
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState([{ role: 'nexus', text: "Ready to explore. Select a subject to begin. You can also ask me to create a new simulation on any physics topic!" }]);

  const launchLab = (exp, subj) => {
    setSelectedSubject(subj);
    setActiveExp(exp);
    setConfig(exp.initialConfig);
    setView('LAB');
    setChatLog([{ role: 'nexus', text: `Nexus ${exp.title} module online. ${exp.isGenerated ? 'This is an AI-generated experiment. ' : ''}How can I help you understand this?` }]);
    clearFailed(exp.id);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isTyping) return;

    const userText = userInput;
    setUserInput("");
    setIsTyping(true);

    // Check if user wants to generate new simulation
    const isGenerationRequest = userText.toLowerCase().includes('create') || 
                               userText.toLowerCase().includes('generate') ||
                               userText.toLowerCase().includes('add new') ||
                               userText.toLowerCase().includes('make a simulation');

    const newLog = [...chatLog, { role: 'user', text: userText }];
    setChatLog(newLog);

    try {
      if (isGenerationRequest) {
        setIsGenerating(true);
        const topic = extractTopic(userText);
        
        // Use dedicated generation function for cleaner response
        const simConfig = await generateSimulationConfig(topic, { ...config, ...liveData, isRunning });
        
        if (simConfig) {
          const result = addGeneratedSim(topic, simConfig);
          
          if (result.success) {
            setChatLog(prev => [...prev, { 
              role: 'nexus', 
              text: `I've created a new simulation: "${simConfig.title || topic}". Click on it in the Physics section to explore!` 
            }]);
          } else {
            setChatLog(prev => [...prev, { 
              role: 'nexus', 
              text: `I couldn't add that simulation: ${result.error}. Try a different topic.` 
            }]);
          }
        } else {
          setChatLog(prev => [...prev, { 
            role: 'nexus', 
            text: `I understood "${topic}" but had trouble generating the simulation format. Try asking me to explain physics concepts instead!` 
          }]);
        }
        setIsGenerating(false);
      } else {
        const response = await getNexusResponse(userText, { ...config, ...liveData, isRunning }, chatLog);

        // Check for COMMAND: in response
        if (response.includes('COMMAND:')) {
          try {
            const parts = response.split('COMMAND:');
            const commandStr = parts[1].trim();
            const command = JSON.parse(commandStr);

            if (command.update) {
              setConfig(prev => ({ ...prev, ...command.update }));
            }

            setChatLog(prev => [...prev, { role: 'nexus', text: parts[0].trim() }]);
          } catch {
            setChatLog(prev => [...prev, { role: 'nexus', text: response }]);
          }
        } else {
          setChatLog(prev => [...prev, { role: 'nexus', text: response }]);
        }
      }
    } catch {
      setChatLog(prev => [...prev, { role: 'nexus', text: "Connection to Brain lost. Try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const extractTopic = (text) => {
    const keywords = [
      'pendulum', 'gravity', 'projectile', 'newton', 'spring', 'wave', 
      'doppler', 'circuit', 'refraction', 'magnetic', 'optics', 'thermodynamics',
      'quantum', 'relativity', 'fluid', 'collision', 'momentum', 'energy',
      'oscillator', 'sound', 'light', 'electric', 'magnetism',
      'cell', 'dna', 'mitosis', 'plate', 'tectonics', 'river', 'carbon', 'plant', 'organelle'
    ];
    
    const lowerText = text.toLowerCase();
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }
    
    // Extract the main topic from common patterns
    const match = text.match(/(?:about|on|topic|subject)\s+(['"]?)([^'"]+)\1/i) || 
                  text.match(/simulation\s+(?:of|for|about)\s+(['"]?)([^'"]+)\1/i);
    if (match) return match[2].trim();
    
    return "New Experiment";
  };

  return (
    <div style={styles.container} className="dashboard-bg">
      {/* SIDEBAR NAVIGATION */}
      <nav style={styles.sidebar} className="glass-panel">
        <div onClick={() => setView('DASHBOARD')} style={styles.logo} className="running-indicator">N</div>
        <LayoutDashboard
          onClick={() => setView('DASHBOARD')}
          style={{ marginTop: '40px', cursor: 'pointer' }}
          color={view === 'DASHBOARD' ? "#3b82f6" : "#475569"}
        />
        <PlusSquare
          onClick={() => setIsCreatorOpen(true)}
          style={{ marginTop: '20px', cursor: 'pointer' }}
          color={isCreatorOpen ? "#fbbf24" : "#475569"}
        />
      </nav>

      {/* DYNAMIC VIEW */}
      {view === 'DASHBOARD' ? (
        <div style={styles.dashboard} className="grid-pattern">
          <div style={styles.headerRow}>
            <h1 style={styles.title}>NEXUS <span style={{ color: '#3b82f6' }}>LEARN</span></h1>
            <div style={styles.genreIndicator}>
              <Sparkles size={16} color="#10b981" />
              <span>AI-Augmented Platform</span>
            </div>
          </div>
          <div style={styles.grid}>
            {subjects.map(subj => (
              <div key={subj.id} style={styles.subjGroup}>
                <h2 style={{ fontSize: '14px', color: subj.color, marginBottom: '15px' }}>{subj.title.toUpperCase()}</h2>
                {subj.experiments.map(exp => {
                  const isFailed = failedSims.some(f => f.id === exp.id);
                  return (
                    <div 
                      key={exp.id} 
                      onClick={() => !isFailed && launchLab(exp, subj)}
                      style={{
                        ...styles.expCard,
                        ...(isFailed ? styles.expCardFailed : {}),
                        '--subj-color': subj.color
                      }}
                      className={isFailed ? '' : 'exp-card-glow'}
                    >
                      <div className="exp-card-content">
                        <exp.icon size={20} color={isFailed ? '#64748b' : subj.color} />
                        <span style={{ fontWeight: '600', color: isFailed ? '#64748b' : 'white', fontSize: '13px' }}>
                          {exp.title}
                        </span>
                        {exp.isGenerated && (
                          <span style={styles.generatedBadge}>NEW</span>
                        )}
                        {exp.difficulty && !isFailed && (
                          <span style={{
                            marginLeft: 'auto',
                            fontSize: '9px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: exp.difficulty === 1 ? 'rgba(16, 185, 129, 0.1)' : exp.difficulty === 2 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: exp.difficulty === 1 ? '#10b981' : exp.difficulty === 2 ? '#f59e0b' : '#ef4444',
                            border: `1px solid ${exp.difficulty === 1 ? 'rgba(16, 185, 129, 0.2)' : exp.difficulty === 2 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                          }}>
                            {exp.difficulty === 1 ? 'Easy' : exp.difficulty === 2 ? 'Medium' : 'Hard'}
                          </span>
                        )}
                        {isFailed && (
                          <span style={styles.failedBadge}>Error</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <LabStage
          activeExp={activeExp} config={config} setConfig={setConfig}
          isRunning={isRunning} setIsRunning={setIsRunning}
          resetKey={resetKey} setResetKey={setResetKey}
          subjectColor={selectedSubject.color}
          onBack={() => setView('DASHBOARD')}
          onUpdate={setLiveData}
          liveData={liveData}
          failedSims={failedSims}
          onSimError={(expId, error) => markFailed(expId, error)}
        />
      )}

      {isCreatorOpen && (
        <NexusCreator
          onCancel={() => setIsCreatorOpen(false)}
          onSave={(draft) => {
            addCreatorSim(draft);
            setIsCreatorOpen(false);
          }}
        />
      )}

      {/* NEXUS BRAIN ASIDE */}
      <aside style={styles.aside} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <BrainCircuit color="#10b981" /> <b>NEXUS BRAIN</b>
          {isGenerating && <Sparkles size={14} color="#fbbf24" style={{ animation: 'pulse 1s infinite' }} />}
        </div>

        <div style={styles.chatArea}>
          {/* Telemetry Display */}
          {Object.keys(liveData).length > 0 && (
            <div style={styles.dataWidget}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={styles.livePulse}></div>
                <p style={{ fontSize: '10px', fontWeight: '800', margin: 0, color: '#3b82f6', letterSpacing: '1px' }}>SYSTEM TELEMETRY</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Object.entries(liveData).map(([k, v]) => (
                  <div key={k} style={styles.dataPoint}>
                    <span style={styles.dataKey}>{k.toUpperCase()}</span>
                    <span style={styles.dataVal}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Plot the first numeric value available */}
              {Object.entries(liveData).find(([, v]) => !isNaN(parseFloat(v))) && (
                <TelemetryGraph
                  data={liveData}
                  activeKey={Object.entries(liveData).find(([, v]) => !isNaN(parseFloat(v)))[0]}
                />
              )}
            </div>
          )}

          {/* Messages */}
          {chatLog.map((m, i) => (
            <div key={i} style={m.role === 'user' ? styles.userMsg : styles.nexusMsg}>
              {m.text}
            </div>
          ))}

          {(isTyping || isGenerating) && (
            <div style={{ ...styles.nexusMsg, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={14} className="animate-spin" /> 
              {isGenerating ? 'Generating simulation...' : 'Analyzing vectors...'}
            </div>
          )}
        </div>

        {/* --- CHAT INPUT AREA --- */}
        <div style={styles.inputArea}>
          <input
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask or request: 'Create a quantum simulation'"
            style={styles.chatInput}
          />
          <button onClick={handleSendMessage} style={styles.sendBtn}>
            <Send size={18} />
          </button>
        </div>
      </aside>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020408', color: 'white', overflow: 'hidden' },
  sidebar: { width: '70px', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px 0' },
  logo: { width: '40px', height: '40px', backgroundColor: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer' },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' },
  title: { fontSize: '28px', fontWeight: '900', margin: 0 },
  genreIndicator: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '20px' },
  dashboard: { flex: 1, padding: '60px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '40px' },
  subjGroup: { background: '#0a0c12', padding: '30px', borderRadius: '24px', border: '1px solid #1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
  expCard: { padding: '18px 20px', background: '#020408', borderRadius: '16px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', marginBottom: '12px' },
  expCardFailed: { opacity: 0.5, cursor: 'not-allowed', borderColor: '#ef4444' },
  generatedBadge: { fontSize: '9px', background: 'rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '2px 6px', borderRadius: '4px' },
  failedBadge: { marginLeft: 'auto', fontSize: '9px', background: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' },
  aside: { width: '400px', backgroundColor: '#05070a', borderLeft: '1px solid #1e293b', padding: '25px', display: 'flex', flexDirection: 'column' },
  chatArea: { flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column' },
  dataWidget: { background: 'rgba(59, 130, 246, 0.03)', padding: '15px', borderRadius: '16px', marginBottom: '25px', border: '1px solid rgba(59, 130, 246, 0.1)' },
  livePulse: { width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 8px #3b82f6' },
  dataPoint: { background: '#020408', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '2px' },
  dataKey: { fontSize: '8px', color: '#64748b', fontWeight: 'bold' },
  dataVal: { fontSize: '12px', color: '#10b981', fontWeight: 'bold', fontFamily: 'var(--font-mono)' },
  userMsg: { alignSelf: 'flex-end', background: '#1e293b', padding: '14px 18px', borderRadius: '18px 18px 4px 18px', marginBottom: '12px', fontSize: '13px', maxWidth: '85%', lineHeight: '1.5' },
  nexusMsg: { alignSelf: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '14px 18px', borderRadius: '18px 18px 18px 4px', marginBottom: '12px', fontSize: '13px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '85%', lineHeight: '1.5' },
  inputArea: { position: 'relative', marginTop: 'auto' },
  chatInput: { width: '100%', backgroundColor: '#0a0c10', border: '1px solid #1e293b', padding: '15px 50px 15px 20px', borderRadius: '16px', color: 'white', outline: 'none', fontSize: '13px', fontFamily: 'var(--font-sans)' },
  sendBtn: { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }
};

export default App;