'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Use 'next/navigation' in App Router
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Prevent NextAuth from redirecting automatically
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password.'); // Show generic error
        console.error('SignIn Error:', result.error);
      } else if (result?.ok) {
        // Login successful, redirect to dashboard or intended page
        router.push('/dashboard'); // Or use router.refresh() if staying on page
      } else {
         setError('Login failed. Please try again.');
      }
    } catch (err) {
       console.error("Login submission failed:", err);
       setError('An unexpected error occurred.');
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {/* Add link to registration page */}
    </div>
  );
}