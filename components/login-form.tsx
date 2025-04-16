// components/login-form.tsx
"use client"; // Essential for hooks

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter, // Keep if needed for footer content
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For errors
import { Terminal } from "lucide-react"; // Example icon
import { useState, FormEvent } from "react"; // Import FormEvent
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation"; // Use 'next/navigation'
import { signIn } from "next-auth/react"; // Import signIn

export function LoginForm() {
  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input
  const [error, setError] = useState<string | null>(null); // State for login errors
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get callbackUrl from query params, default to /dashboard if not present
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => { // Use FormEvent<HTMLFormElement>
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      // --- Use NextAuth signIn ---
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually based on result
        email,
        password,
      });
      // --- End NextAuth signIn ---

      if (result?.error) {
        // Handle specific errors if needed, or show a generic message
        setError('Invalid email or password. Please try again.');
        console.error('SignIn Error:', result.error);
        setIsLoading(false);
      } else if (result?.ok) {
        // --- SUCCESS: Redirect Manually ---
        console.log('Login successful, redirecting to:', callbackUrl);
        router.push(callbackUrl); // Navigate to the original page or dashboard
        // No need to setIsLoading(false) here as the page will navigate away
      } else {
         // Handle unexpected non-error, non-ok response
         setError('Login failed. Please try again.');
         setIsLoading(false);
      }
    } catch (err) {
      console.error("Login submission exception:", err);
      setError('An unexpected error occurred during login.');
      setIsLoading(false);
    }
  };

  // --- Functions for OAuth buttons (Example) ---
   const handleOAuthSignIn = (provider: string) => {
      setIsLoading(true); // Optional: show loading state for OAuth too
      // SignIn with OAuth usually handles redirect automatically
      // You might want to pass callbackUrl here if needed by your setup,
      // though often NextAuth handles it implicitly with OAuth.
      signIn(provider, { callbackUrl });
   }


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Card structure remains the same */}
      <Card className="w-[350px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Kanaka Platform</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* OAuth buttons - add onClick handlers */}
          <div className="grid grid-cols-2 gap-6">
            <Button variant="outline" onClick={() => handleOAuthSignIn('google')} disabled={isLoading}>
              Google
            </Button>
            <Button variant="outline" onClick={() => handleOAuthSignIn('azure-ad')} disabled={isLoading}> {/* Assuming 'azure-ad' is your provider ID */}
              Microsoft
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Display Login Error */}
          {error && (
              <Alert variant="destructive" className="mt-4">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {/* Bind form submit handler */}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                {/* Bind email state */}
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {/* Keep Forgot password link functional if needed */}
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Forgot password?
                  </a>
                </div>
                {/* Bind password state */}
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {/* Submit button with loading state */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>
        </CardContent>
         {/* Keep footer */}
         <CardFooter className="flex flex-col">
           <p className="mt-2 text-xs text-center text-muted-foreground">
             By signing in, you agree to our{" "}
             <a href="#" className="underline underline-offset-4 hover:text-primary">
               Terms of Service
             </a>{" "}
             and{" "}
             <a href="#" className="underline underline-offset-4 hover:text-primary">
               Privacy Policy
             </a>
             .
           </p>
         </CardFooter>
      </Card>
    </motion.div>
  );
}