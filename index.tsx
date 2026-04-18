import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import { ClerkSsoCallback } from './components/ClerkSsoCallback';
import { TherapistInviteAccept } from './components/TherapistInviteAccept';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const pathname = window.location.pathname;
const isSsoCallbackRoute = pathname === '/sso-callback';
const isTherapistInviteRoute = pathname.startsWith('/therapist-invite/');
const therapistInviteToken = isTherapistInviteRoute ? pathname.replace('/therapist-invite/', '') : null;

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey || ''}>
      {isSsoCallbackRoute ? (
        <ClerkSsoCallback />
      ) : isTherapistInviteRoute && therapistInviteToken ? (
        <TherapistInviteAccept token={therapistInviteToken} onSuccess={() => { window.location.href = '/login?invite=success'; }} />
      ) : (
        <App />
      )}
    </ClerkProvider>
  </React.StrictMode>
);