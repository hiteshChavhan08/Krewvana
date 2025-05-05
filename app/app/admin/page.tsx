// app/app/admin/page.tsx
import React from 'react';
import { getCurrentUser } from '@/lib/auth'; // Adjust path if needed
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation'; // Using redirect for cleaner access control
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { AdminPageClient } from '@/components/admin/AdminPageClient'; // Adjust path

// Metadata for the page
export const metadata = {
    title: "Admin Panel - Krewvana",
    description: "Manage users and platform settings.",
};

export default async function AdminPage() {
    // Fetch user on the server to check role immediately
    const user = await getCurrentUser();

    // Verify if the user is logged in and is an ADMIN
    if (!user || user.role !== UserRole.ADMIN) {
        // Redirect non-admins to the main dashboard (or show a specific error page)
        // This prevents rendering any part of the admin UI for unauthorized users.
        console.log(`[Admin Page Server] Access denied. User Role: ${user?.role}, Required: ${UserRole.ADMIN}`);
        redirect('/app'); // Redirect to the main app dashboard

        // --- Alternative: Show Error Message (Less Secure - UI flashes briefly) ---
        /*
        return (
            <div className="container mx-auto py-8 px-4">
                <Alert variant="destructive" className="max-w-lg mx-auto">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to access this page.
                    </AlertDescription>
                </Alert>
            </div>
        );
        */
    }

    // If the user is an Admin, render the client component wrapper
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6 border-b pb-4">Admin Control Panel</h1>
            {/* The client component handles the interactive parts and data fetching for sections */}
            <AdminPageClient />
        </div>
    );
}