// app/app/layout.tsx
import React from 'react';
import AppLayout from '@/components/layout/AppLayout'; // Import the new layout

interface AppLayoutProps {
  children: React.ReactNode;
}

// This layout applies only to routes within the /app folder
export default function Layout({ children }: AppLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
}