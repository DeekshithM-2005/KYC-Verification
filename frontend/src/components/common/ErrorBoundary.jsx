import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white tracking-tight">System Malfunction</h1>
            
            <p className="text-slate-400">
              A critical UI error occurred. We've logged this incident. Please try navigating back or returning home.
            </p>

            <div className="p-4 bg-surface-dark border border-border-dark rounded-lg overflow-x-auto text-left">
              <code className="text-red-300 text-xs font-mono">{this.state.error?.toString()}</code>
            </div>
            
            <div className="pt-4 border-t border-border-dark flex gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-surface-hover hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors border border-border-dark"
              >
                Reload Page
              </button>
              <Link 
                to="/"
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                <Home className="w-4 h-4" /> Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
