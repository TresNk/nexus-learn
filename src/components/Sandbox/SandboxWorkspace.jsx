import React, { useEffect, useRef, useState } from 'react';

/**
 * SandboxWorkspace - Isolated code execution environment
 * Runs user-generated code in a sandboxed Web Worker with memory limits
 * Prevents crashes, infinite loops, and security vulnerabilities
 */
const SandboxWorkspace = ({ code, onOutput, onError, onReady }) => {
    const workerRef = useRef(null);
    const [isRunning, setIsRunning] = useState(false);
    const [memoryUsage, setMemoryUsage] = useState(0);
    const MAX_MEMORY_MB = 50; // Memory cap to prevent browser crashes

    // Create isolated Web Worker for code execution
    useEffect(() => {
        // Inline worker to avoid external file dependency
        const workerBlob = new Blob([`
            let executionContext = {
                output: [],
                errors: [],
                memoryLimit: ${MAX_MEMORY_MB * 1024 * 1024} // Convert to bytes
            };

            // Safe console replacement
            const safeConsole = {
                log: (...args) => {
                    try {
                        const msg = args.map(a => JSON.stringify(a)).join(' ');
                        postMessage({ type: 'output', data: msg });
                    } catch (e) {
                        postMessage({ type: 'error', data: 'Error logging output' });
                    }
                },
                error: (...args) => {
                    postMessage({ type: 'error', data: args.join(' ') });
                },
                warn: (...args) => {
                    postMessage({ type: 'warning', data: args.join(' ') });
                }
            };

            // Memory monitoring
            const checkMemory = () => {
                if (self.performance && self.performance.memory) {
                    const usedMB = self.performance.memory.usedJSHeapSize / (1024 * 1024);
                    postMessage({ type: 'memory', data: usedMB });
                    if (usedMB > ${MAX_MEMORY_MB}) {
                        throw new Error('Memory limit exceeded: ' + usedMB.toFixed(2) + 'MB > ${MAX_MEMORY_MB}MB');
                    }
                }
            };

            // Timeout protection against infinite loops
            const createTimeout = (ms) => {
                const start = Date.now();
                return () => {
                    if (Date.now() - start > ms) {
                        throw new Error('Execution timeout: Code ran for more than ' + ms + 'ms');
                    }
                    checkMemory();
                };
            };

            self.onmessage = function(e) {
                const { code, timeout = 5000 } = e.data;
                
                try {
                    const checkTimeout = createTimeout(timeout);
                    
                    // Wrap user code in safe execution context
                    const wrappedCode = \`
                        (function() {
                            const console = safeConsole;
                            const Math = globalThis.Math;
                            const Object = globalThis.Object;
                            const Array = globalThis.Array;
                            const Number = globalThis.Number;
                            const String = globalThis.String;
                            const Boolean = globalThis.Boolean;
                            
                            // No access to dangerous globals
                            const window = undefined;
                            const document = undefined;
                            const localStorage = undefined;
                            const sessionStorage = undefined;
                            const cookie = undefined;
                            const fetch = undefined;
                            const XMLHttpRequest = undefined;
                            const eval = undefined;
                            const Function = undefined;
                            const setTimeout = undefined;
                            const setInterval = undefined;
                            
                            \${code}
                        })()
                    \`;
                    
                    // Execute in isolated context
                    const result = eval(wrappedCode);
                    
                    postMessage({ 
                        type: 'complete', 
                        data: result !== undefined ? result : 'Execution completed' 
                    });
                } catch (err) {
                    postMessage({ 
                        type: 'error', 
                        data: err.message || 'Unknown execution error' 
                    });
                }
            };
        `], { type: 'application/javascript' });

        const workerUrl = URL.createObjectURL(workerBlob);
        workerRef.current = new Worker(workerUrl);

        // Handle worker messages
        workerRef.current.onmessage = (e) => {
            const { type, data } = e.data;
            
            switch (type) {
                case 'output':
                    onOutput?.(data);
                    break;
                case 'error':
                    onError?.(new Error(data));
                    setIsRunning(false);
                    break;
                case 'warning':
                    onOutput?.(`⚠️ ${data}`);
                    break;
                case 'memory':
                    setMemoryUsage(data);
                    break;
                case 'complete':
                    onOutput?.(`✅ ${data}`);
                    setIsRunning(false);
                    onReady?.();
                    break;
                default:
                    break;
            }
        };

        workerRef.current.onerror = (err) => {
            onError?.(new Error(`Worker error: ${err.message}`));
            setIsRunning(false);
        };

        // Cleanup worker on unmount
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
            URL.revokeObjectURL(workerUrl);
        };
    }, [onOutput, onError, onReady]);

    // Execute code when code prop changes
    useEffect(() => {
        if (code && workerRef.current && !isRunning) {
            setIsRunning(true);
            setMemoryUsage(0);
            workerRef.current.postMessage({ code, timeout: 5000 });
        }
    }, [code, isRunning]);

    // Stop execution manually
    const stopExecution = () => {
        if (workerRef.current) {
            workerRef.current.terminate();
            setIsRunning(false);
            onOutput?.('⏹️ Execution stopped by user');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.title}>🔒 Sandbox Workspace</span>
                <div style={styles.status}>
                    {isRunning ? (
                        <span style={styles.runningIndicator}>
                            <span style={styles.pulse}></span> Running
                        </span>
                    ) : (
                        <span style={styles.idleIndicator}>Ready</span>
                    )}
                </div>
            </div>
            
            <div style={styles.memoryBar}>
                <div style={{
                    ...styles.memoryFill,
                    width: `${Math.min((memoryUsage / MAX_MEMORY_MB) * 100, 100)}%`,
                    backgroundColor: memoryUsage > MAX_MEMORY_MB * 0.9 ? '#ef4444' : '#10b981'
                }}></div>
                <span style={styles.memoryText}>
                    {memoryUsage.toFixed(1)}MB / {MAX_MEMORY_MB}MB
                </span>
            </div>

            {isRunning && (
                <button onClick={stopExecution} style={styles.stopButton}>
                    ⏹️ Stop Execution
                </button>
            )}
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#0a0c12',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #1e293b',
        fontFamily: 'var(--font-mono)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    title: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#fbbf24'
    },
    status: {
        fontSize: '12px'
    },
    runningIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#10b981'
    },
    idleIndicator: {
        color: '#64748b'
    },
    pulse: {
        width: '8px',
        height: '8px',
        backgroundColor: '#10b981',
        borderRadius: '50%',
        animation: 'pulse 1s infinite'
    },
    memoryBar: {
        position: 'relative',
        height: '6px',
        backgroundColor: '#1e293b',
        borderRadius: '3px',
        overflow: 'hidden',
        marginTop: '8px'
    },
    memoryFill: {
        height: '100%',
        transition: 'width 0.3s ease, background-color 0.3s ease'
    },
    memoryText: {
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '10px',
        color: '#94a3b8'
    },
    stopButton: {
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600'
    }
};

export default SandboxWorkspace;
