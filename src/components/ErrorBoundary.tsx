import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1.5rem',
            padding: '3rem',
            maxWidth: '500px',
            width: '100%',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐾</div>
            <h1 style={{ color: '#5eead4', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              HydroNourish — Loading Issue
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: '1.6' }}>
              The dashboard encountered a startup error. Click below to reload.
            </p>
            <button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
                }
                localStorage.removeItem('hn_pets');
                window.location.reload();
              }}
              style={{
                background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.875rem 2rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              🔄 Clear Cache &amp; Reload
            </button>
            {this.state.error && (
              <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <summary style={{ color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>
                  Technical Details
                </summary>
                <pre style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '0.5rem',
                  color: '#f87171',
                  fontSize: '0.7rem',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
