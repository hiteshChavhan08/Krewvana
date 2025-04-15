// --- File: app/page.tsx ---
// Default route - Redirects to dashboard or could be a landing page
import { redirect } from 'next/navigation';

export default function HomePage() {
  // For now, redirect straight to the dashboard after login
  redirect('/dashboard');
  // Alternatively, you could render a welcome/landing page here
  // return (<h1>Welcome to Kanaka!</h1>);
}