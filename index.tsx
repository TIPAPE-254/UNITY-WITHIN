import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import { ClerkSsoCallback } from './components/ClerkSsoCallback';
import { TherapistInviteAccept } from './components/TherapistInviteAccept';
import { SupportCall } from './src/components/SupportCall';

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
const isSupportCallRoute = pathname.startsWith('/support-call/');
const supportCallRoomId = isSupportCallRoute ? pathname.replace('/support-call/', '') : null;
const supportCallMode = new URLSearchParams(window.location.search).get('mode') === 'video' ? 'video' : 'voice';

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey || ''}>
      {isSsoCallbackRoute ? (
        <ClerkSsoCallback />
      ) : isTherapistInviteRoute && therapistInviteToken ? (
        <TherapistInviteAccept token={therapistInviteToken} onSuccess={() => { window.location.href = '/login?invite=success'; }} />
      ) : isSupportCallRoute && supportCallRoomId ? (
        <SupportCall roomId={supportCallRoomId} mode={supportCallMode} />
      ) : (
        <App />
      )}
    </ClerkProvider>
  </React.StrictMode>
);