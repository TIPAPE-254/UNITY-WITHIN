import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children?: React.ReactNode;
}

/**
 * Simple error fallback component
 * Note: For a full error boundary, use a class component or a library like react-error-boundary
 */
export function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-xl border border-pink-100 text-center">
        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-pink-500" size={40} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">
          We're sorry, but an unexpected error occurred.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left overflow-auto max-h-48">
          <p className="text-red-500 font-mono text-sm break-words">
            {error?.toString()}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="bg-pink-500 hover:bg-pink-600"
          >
            <RefreshCw size={18} className="mr-2" />
            Reload Page
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            <Home size={18} className="mr-2" />
            Clear Data & Reload
          </Button>
        </div>
      </div>
    </div>
  );
}

// Deprecated: Use react-error-boundary for full Error Boundary functionality
export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  return <>{children}</>;
}
