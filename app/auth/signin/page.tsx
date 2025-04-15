// --- File: app/auth/signin/page.tsx ---
// ** Create this basic sign-in page **
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from 'next/navigation'; // Use next/navigation for app router

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignIn = async (provider: string | undefined, options?: any) => {
        setIsLoading(true);
        setError(null);
        const result = await signIn(provider, {
            redirect: false, // Handle redirect manually after checking result
            callbackUrl: '/dashboard', // Where to redirect on success
            ...options // Include credentials here for 'credentials' provider
        });

        setIsLoading(false);

        if (result?.error) {
            setError(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
        } else if (result?.ok) {
            // Redirect to dashboard on successful sign-in
            router.push('/dashboard');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Sign In</CardTitle>
                    <CardDescription>
                        Enter your credentials to access Kanaka.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {/* Email/Password Form */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button
                        className="w-full"
                        onClick={() => handleSignIn('credentials', { email, password })}
                        disabled={isLoading || !email || !password}
                    >
                        {isLoading ? 'Signing In...' : 'Sign in with Email'}
                    </Button>

                    {/* Divider */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    {/* Add buttons for other providers (e.g., Google) here */}
                     <Button variant="outline" className="w-full" onClick={() => handleSignIn('google')} disabled={isLoading}>
                         {/* Add Google Icon */} Sign in with Google (Setup Required)
                     </Button>

                </CardContent>
                {/* Optional Footer */}
                {/* <CardFooter>
                    <p className="text-xs text-muted-foreground">
                        Don't have an account? Contact your administrator.
                    </p>
                </CardFooter> */}
            </Card>
        </div>
    );
}