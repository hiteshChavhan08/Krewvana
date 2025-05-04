// app/auth/signin/page.tsx
"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email: email,
      password: password,
      callbackUrl: callbackUrl,
    });
    setLoading(false);
    if (result?.error) {
      const errorMessage =
        error === "CredentialsSignin"
          ? "Invalid email or password."
          : "Sign in failed. Please try again.";
      toast.error("Sign In Failed", { description: errorMessage });
    } else if (result?.ok) {
      // Set the flag to localStorage after successful sign-in
      localStorage.setItem("isSignedIn", "true");

      toast.success("Sign In Successful", { description: "Welcome back!" });
      setTimeout(() => router.push(callbackUrl), 500); // Redirect after slight delay
    } else {
      toast.error("Sign In Failed", {
        description: "An unexpected issue occurred.",
      });
    }
  };

  //   const ErrorDisplay = () => { /* ... same ErrorDisplay component as before ... */ }; // Copy ErrorDisplay from previous example
  const ErrorDisplay = () => {
    if (!error) return null;
    let message = "An unknown error occurred.";
    if (error === "CredentialsSignin") {
      message = "Invalid email or password provided.";
    } else if (error === "Callback" || error === "OAuthCallback") {
      message = "There was an issue with the sign-in provider.";
    }
    // Add more specific error mappings as needed

    return (
      <div className="bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-md mb-4">
        <p>
          <strong>Error:</strong> {message}
        </p>
      </div>
    );
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Enter credentials to access Kanaka.</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorDisplay />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              {/* ... Email and Password Inputs as before ... */}
              <div className="grid gap-2">
                {" "}
                <Label htmlFor="email">Email</Label>{" "}
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />{" "}
              </div>
              <div className="grid gap-2">
                {" "}
                <Label htmlFor="password">Password</Label>{" "}
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />{" "}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {" "}
                {loading ? "Signing In..." : "Sign In"}{" "}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
