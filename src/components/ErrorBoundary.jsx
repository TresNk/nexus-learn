import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error('Simulation Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={styles.fallbackContainer}>
                    <div style={styles.fallbackIcon}>⚠️</div>
                    <div style={styles.fallbackTitle}>Simulation Unavailable</div>
                    <div style={styles.fallbackMessage}>
                        {this.props.simulationName || 'This experiment'} is temporarily unavailable.
                    </div>
                    <button 
                        onClick={() => this.setState({ hasError: false })}
                        style={styles.retryButton}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    fallbackContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#010204',
        color: '#94a3b8',
        fontFamily: 'monospace',
    },
    fallbackIcon: {
        fontSize: '48px',
        marginBottom: '20px',
    },
    fallbackTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: '10px',
    },
    fallbackMessage: {
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '20px',
        textAlign: 'center',
    },
    retryButton: {
        background: 'rgba(59, 130, 246, 0.2)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        color: '#3b82f6',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '12px',
    }
};

export default ErrorBoundary;