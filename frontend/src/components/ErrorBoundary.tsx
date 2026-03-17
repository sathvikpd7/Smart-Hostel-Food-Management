import React, { ReactNode, ReactElement } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactElement;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 * with error details and recovery options
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });
    
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Oops! Something went wrong
              </h1>

              <p className="text-gray-600 text-center mb-4">
                We encountered an unexpected error. Please try again or contact support if the problem persists.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                  <summary className="font-semibold cursor-pointer text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-40 text-red-600 bg-white p-2 rounded border border-red-200">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  aria-label="Try again"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  aria-label="Go to home page"
                >
                  <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                  Home
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
