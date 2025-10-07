// FILE: src/components/common/ErrorBoundary.tsx

import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Button } from '../ui/Button'; // We'll use our Button component

// 1. We create a default "Fallback Component".
//    This is the UI that will be displayed to the user when an error is caught.
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // We can log the error to a service like Sentry, LogRocket, etc. here.
  // For now, we'll just log it to the console.
  console.error("Caught by ErrorBoundary:", error);

  return (
    <div
      role="alert"
      className="flex h-screen w-screen flex-col items-center justify-center bg-background p-8 text-center"
    >
      <h2 className="mb-4 text-2xl font-bold text-destructive">
        Something went wrong.
      </h2>
      <p className="mb-6 text-muted-foreground">
        We're sorry, an unexpected error occurred. Please try refreshing the page or clicking the button below.
      </p>
      
      {/* The `resetErrorBoundary` function will try to re-render the children.
          This is useful if the error was a temporary issue. */}
      <Button onClick={resetErrorBoundary} variant="destructive">
        Try Again
      </Button>

      {/* For development, it's helpful to see the actual error message */}
      {import.meta.env.DEV && (
        <pre className="mt-8 w-full max-w-2xl overflow-auto whitespace-pre-wrap rounded bg-secondary p-4 text-left text-sm text-secondary-foreground">
          {error.message}
        </pre>
      )}
    </div>
  );
}

// 2. We create our main AppErrorBoundary component.
//    It's a wrapper around the library's ErrorBoundary, pre-configured with our FallbackComponent.
type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}