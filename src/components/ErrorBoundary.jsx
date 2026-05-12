import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error(`[ErrorBoundary] ${this.props.simulationName || 'App'}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={styles.error}>
                    <h3>Simulation Unavailable</h3>
                    <p>There was a glitch in the simulation engine.</p>
                    <button 
                        onClick={() => this.setState({ hasError: false })}
                        style={styles.btn}
                    >
                        Reload Module
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    error: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#05070a',
        color: '#ef4444',
        fontFamily: 'monospace',
        padding: '20px',
        textAlign: 'center'
    },
    btn: {
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
};

export default ErrorBoundary;