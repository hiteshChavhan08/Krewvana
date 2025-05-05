// app/app/layout.tsx (or your equivalent layout file)
import React from "react";
import { AppSidebarLayout } from "@/components/layout/AppSidebarLayout"; // Adjust import path
import { getCurrentUser } from "@/lib/auth"; // Import your function
import { User } from "@prisma/client"; // Import the User type if needed for type checking

// Define a specific type for the user data passed to the client component
// Only include fields the client component actually needs.
type UserSidebarProps = {
  name: string | null;
  image: string | null;
} | null; // Can be null if user isn't logged in or data is missing

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the user data on the server
  const currentUser: User | null = await getCurrentUser();

  // Prepare the data to be passed as props
  // Only pass the necessary fields to the client component
  const userProps: UserSidebarProps = currentUser
    ? {
        name: currentUser.name, // Assumes 'name' field exists on your User model
        image: currentUser.image, // Assumes 'image' field exists on your User model
      }
    : null;

  return <AppSidebarLayout user={userProps}>{children}</AppSidebarLayout>;
}

// Optional: Add metadata for this section
export const metadata = {
  title: "Krewvana Dashboard", // Updated example title
  description: "Krewvana application dashboard area.",
};
