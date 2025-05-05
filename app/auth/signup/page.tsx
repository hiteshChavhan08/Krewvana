// app/app/signup/page.tsx
'use client'; // This page requires client-side interactivity

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react'; // To redirect if already logged in

// Client-side validation schema (includes password confirmation)
const signupFormSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
    email: z.string().email({ message: "Please enter a valid email" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string()
})
.refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Error applies to the confirm password field
});

type SignupFormData = z.infer<typeof signupFormSchema>;


export default function SignupPage() {
    const router = useRouter();
    const { status: sessionStatus } = useSession(); // Check session status
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupFormSchema),
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    });

     // Redirect if user is already logged in
     useEffect(() => {
        if (sessionStatus === 'authenticated') {
            toast.info("You are already logged in.");
            router.replace('/'); // Redirect to home or dashboard
        }
    }, [sessionStatus, router]);

    const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
        setIsSubmitting(true);
        const toastId = toast.loading("Creating your account...");

        try {
             // We only need to send name, email, password to the API
             const payload = {
                 name: data.name,
                 email: data.email,
                 password: data.password,
             };

            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();

            if (!response.ok) {
                // Handle specific errors from API (like email exists)
                 const errorMessage = responseData.message || // Use message from API if available
                                    (responseData.errors // Handle Zod validation errors from API
                                     ? Object.entries(responseData.errors)
                                         .map(([field, messages]: [string, any]) => `${field}: ${messages?._errors?.join(', ') ?? 'Invalid input'}`)
                                         .join('; ')
                                     : `Error ${response.status}`);
                 throw new Error(errorMessage);
            }

            toast.success("Account Created!", {
                description: "Please log in with your new credentials.",
                id: toastId
            });
            reset(); // Clear the form
            router.push('auth/signin'); // Redirect to login page

        } catch (error: any) {
            console.error("Signup failed:", error);
            toast.error("Signup Failed", {
                description: error.message || "An unexpected error occurred. Please try again.",
                id: toastId
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Prevent rendering form if session is loading or authenticated
    if (sessionStatus === 'loading' || sessionStatus === 'authenticated') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }


    return (
        <div className="flex justify-center items-center min-h-screen bg-muted/40 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <CardDescription>Enter your details to sign up for Krewvana.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your Name"
                                {...register("name")}
                                aria-invalid={!!errors.name}
                            />
                            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your.email@example.com"
                                {...register("email")}
                                aria-invalid={!!errors.email}
                            />
                             {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <Label htmlFor="password">Password</Label>
                             <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                {...register("password")}
                                aria-invalid={!!errors.password}
                            />
                            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                             <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="********"
                                {...register("confirmPassword")}
                                aria-invalid={!!errors.confirmPassword}
                            />
                            {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
                        </div>


                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Sign Up
                        </Button>
                    </form>
                </CardContent>
                 <CardFooter className="text-center text-sm text-muted-foreground justify-center">
                    Already have an account? 
                    <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                        Log In
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}