import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-white p-8">
          <h1 className="text-3xl font-bold text-rose-500 mb-4">Something went wrong.</h1>
          <p className="text-slate-300 mb-4">The teleconsultation room encountered a rendering error.</p>
          <pre className="bg-slate-900 p-4 rounded-lg text-sm text-rose-400 overflow-auto max-w-2xl text-left border border-slate-800 break-words whitespace-pre-wrap w-full">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-indigo-600 rounded-full font-semibold hover:bg-indigo-700 transition-colors">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
