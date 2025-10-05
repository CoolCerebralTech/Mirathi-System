// src/components/common/ErrorBoundary.tsx
// ============================================================================
// Application Error Boundary
// ============================================================================
// - A React Class Component that catches JavaScript errors in its child
//   component tree, logs those errors, and displays a fallback UI.
// - Prevents a single component's crash from taking down the entire application.
// - Should be used to wrap major sections of the app, like the main router.
// ============================================================================

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-100">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong.</h1>
            <p className="mt-2 text-gray-700">
                We've been notified of the issue. Please refresh the page to continue.
            </p>
        </div>
      );
    }

    return this.props.children;
  }
}