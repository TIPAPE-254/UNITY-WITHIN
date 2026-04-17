import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import { ClerkSsoCallback } from './components/ClerkSsoCallback';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isSsoCallbackRoute = window.location.pathname === '/sso-callback';

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey || ''}>
      {isSsoCallbackRoute ? <ClerkSsoCallback /> : <App />}
    </ClerkProvider>
  </React.StrictMode>
);