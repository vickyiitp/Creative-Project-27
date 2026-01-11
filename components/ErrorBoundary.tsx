import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
          <div className="bg-black border-2 border-red-600 p-8 max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.5)] font-mono text-center">
            <h1 className="text-4xl text-red-600 font-bold mb-4 tracking-widest uppercase">System Failure</h1>
            <div className="w-full h-px bg-red-900 mb-6"></div>
            <p className="text-red-400 mb-6 text-sm leading-relaxed">
              CRITICAL ERROR DETECTED IN RADAR SUBSYSTEM.<br/>
              CODE: {this.state.error?.message || 'UNKNOWN_EXCEPTION'}
            </p>
            <button
              onClick={this.handleReload}
              className="bg-red-900/20 hover:bg-red-900/50 border border-red-600 text-red-500 px-6 py-3 uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              Force Reboot
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}