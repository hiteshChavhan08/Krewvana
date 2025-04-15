// --- File: components/providers/session-provider.tsx ---
// Create this component to wrap your layout
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import React from 'react';

interface SessionProviderProps {
  children: React.ReactNode;
  // You might pass the session object here if needed for server components,
  // but for client-side fetching, SessionProvider handles it.
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}