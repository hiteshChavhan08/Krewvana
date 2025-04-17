// app/app/_components/SignOutButton.tsx
'use client';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <Button onClick={() => signOut({ callbackUrl: '/auth/signin' })} variant="outline">
      Sign Out
    </Button>
  );
}