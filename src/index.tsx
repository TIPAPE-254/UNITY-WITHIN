import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
// import App from './App'; // access through lazy load
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import ReactGA from 'react-ga4';

// Initialize Google Analytics
const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (gaId && gaId !== 'G-XXXXXXXXXX') {
  ReactGA.initialize(gaId);
  ReactGA.send("pageview");
}

// Lazy load App to catch module-level errors
const App = React.lazy(() => import('./App'));

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color:red; padding: 20px;">CRITICAL ERROR: Root element not found</div>';
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<div className="p-10 text-xl text-pink-600">Loading Application...</div>}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (e: any) {
  console.error("React Mount Error:", e);
  rootElement.innerHTML = `<div style="color:red; padding: 20px;">
    <h1>React Mount Failed</h1>
    <pre>${e?.toString()}</pre>
    <pre>${e?.stack}</pre>
  </div>`;
}