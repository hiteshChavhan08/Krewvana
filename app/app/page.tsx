// app/app/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Check path
import { redirect } from 'next/navigation';
import SignOutButton from './_components/SignOutButton'; // Check path

export default async function AppPage() {
  const session = await getServerSession(authOptions);
  if (!session) { redirect('/auth/signin?callbackUrl=/app'); }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Welcome to the App! (No Src)</h1>
      <p className="mb-6">You are logged in.</p>
      <p className="text-sm text-gray-600 mb-2">Email: {session.user?.email}</p>
      <p className="text-sm text-gray-600 mb-6">ID: {session.user?.id}</p>
      <SignOutButton />
    </div>
  );
}