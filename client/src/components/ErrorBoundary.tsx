import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cyber-black flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-cyber-dark border-2 border-cyber-danger rounded-xl p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-cyber-danger/10 flex items-center justify-center">
                <AlertTriangle size={32} className="text-cyber-danger" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-black text-white mb-2">
                SYSTEM <span className="text-cyber-danger">FAILURE</span>
              </h1>
              <p className="text-cyber-muted font-mono text-sm">
                A critical error has occurred in this sector.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-cyber-black/50 border border-white/10 rounded p-4 text-left">
                <p className="text-xs font-mono text-cyber-danger break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full px-6 py-3 bg-cyber-danger text-white font-black rounded hover:bg-red-600 transition-colors uppercase tracking-wider"
            >
              Reinitialize System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
