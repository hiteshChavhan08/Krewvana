// app/app/settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form"; // Import Form component
import { Loader2, Terminal } from "lucide-react";

// API, Types, Schema, Sub-components
import { UserSettingsUpdateSchema } from "@/services/userService"; // Adjust path
import {
  type UserProfile as UserProfileType,
  type SkillData,
} from "@/types/user"; // Adjust path type name if needed
import type { Skill } from "@prisma/client"; // Import Skill type from Prisma generate output if needed
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm"; // Adjust path
import { PositionSelector } from "@/components/settings/PositionSelector"; // Adjust path
import { SkillsSelector } from "@/components/settings/SkillsSelector"; // Adjust path
import { ProfileSkeleton } from "@/components/profile/profile-skeleton"; // Reuse or create SettingsSkeleton

// Define the combined form values type based on the schema used in the service
type SettingsFormValues = z.infer<typeof UserSettingsUpdateSchema>;

// --- NEW: Client-side fetch function ---
async function fetchProfileDataFromApi(): Promise<UserProfileType> {
  // Use specific type
  const response = await fetch("/api/users/me"); // Call the API endpoint
  if (!response.ok) {
    let errorMsg = "Failed to fetch profile data";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch (e) {
      /* Ignore if response not JSON */
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

// --- NEW: Client-side update function ---
async function updateSettingsViaApi(data: SettingsFormValues): Promise<any> {
  // Define return type if needed
  const response = await fetch("/api/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let errorMsg = "Failed to update settings";
    try {
      const errorData = await response.json();
      // Look for specific validation errors if backend sends them
      const validationError =
        errorData.details?.[0]?.message ||
        errorData.errors?.[Object.keys(errorData.errors)[0]]?.[0];
      errorMsg =
        validationError || errorData.error || errorData.message || errorMsg;
    } catch (e) {
      /* Ignore */
    }
    throw new Error(errorMsg);
  }
  return response.json(); // Return the updated data from API
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;

  // --- State ---
  // No separate 'isEditing' state needed if form is always present but maybe disabled initially

  // --- Data Fetching ---
  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
    error: profileError,
  } = useQuery<UserProfileType>({
    // Use 'any' or create a specific type matching service return
    queryKey: ["userProfile", userId], // Use the same key as profile page for cache sharing
    queryFn: fetchProfileDataFromApi, // Exclamation mark assumes userId is checked
    enabled: !!userId && sessionStatus === "authenticated", // Only run when userId is available
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // --- React Hook Form Setup ---
  // Initialize the form
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(UserSettingsUpdateSchema),
    defaultValues: {
      // Set default values once profile loads
      name: "",
      hobbies: "",
      favoriteFood: "",
      askMeAbout: "",
      positionId: null, // Default to null or empty string
      skillNames: [],
    },
  });

  // --- Effect to reset form when profile data loads ---
  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name || "",
        hobbies: userProfile.hobbies || "",
        favoriteFood: userProfile.favoriteFood || "",
        askMeAbout: userProfile.askMeAbout || "",
        positionId: userProfile.position?.id || null,
        // Map skills from {id, name} array to name array for the form state
        skillNames: userProfile.skills?.map((s: SkillData) => s.name) || [],
      });
    }
  }, [userProfile, form.reset]);

  // --- Data Mutation ---
  const mutation = useMutation({
    mutationFn: updateSettingsViaApi, // Pass userId and validated data
    onSuccess: (updatedData) => {
      toast.success("Settings Updated!");
      // Update profile query cache with new data
      queryClient.setQueryData(["userProfile", userId], (oldData: any) => {
        // Be careful merging here, ensure structure matches getUserProfile return
        // It's often safer to just invalidate and let it refetch
        return oldData ? { ...oldData, ...updatedData } : updatedData;
      });
      // queryClient.invalidateQueries({ queryKey: ['userProfile', userId] }); // Alternatively invalidate
      form.reset(form.getValues()); // Reset dirty state after successful save
    },
    onError: (error: Error) => {
      toast.error("Update Failed", { description: error.message });
    },
  });

  // --- Form Submit Handler ---
  const onSubmit = (values: SettingsFormValues) => {
    // console.log("Submitting values:", values);
    // Prepare data: remove fields that haven't changed? Optional.
    // Service layer handles the update logic.
    mutation.mutate(values);
  };

  // --- Loading and Error States ---
  if (
    sessionStatus === "loading" ||
    (sessionStatus === "authenticated" && isLoadingProfile)
  ) {
    return <ProfileSkeleton />; // Use a suitable skeleton
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="container py-8">Please log in to access settings.</div>
    );
  }

  if (isErrorProfile) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            {profileError?.message || "Could not load profile data."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

      {/* Use the Shadcn Form component to provide context */}
      <Form {...form}>
        {/* form.handleSubmit wraps our onSubmit function */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* --- Basic Profile Section --- */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your display name and personal details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Pass form instance down */}
              <ProfileSettingsForm form={form} disabled={mutation.isPending} />
            </CardContent>
          </Card>

          <Separator />

          {/* --- Position Section --- */}
          <Card>
            <CardHeader>
              <CardTitle>Job Position</CardTitle>
              <CardDescription>
                Select your current role within the company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    {/* Use PositionSelector - it fetches its own options */}
                    <PositionSelector
                      currentPositionId={field.value} // Bind value
                      onValueChange={field.onChange} // Bind change handler
                      isVerified={userProfile?.isPositionVerified} // Pass verification status
                      disabled={mutation.isPending}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* --- Skills Section --- */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                Showcase your expertise. Add relevant technical or soft skills.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="skillNames" // Bind to the array of names
                render={({ field }) => (
                  <FormItem>
                    <SkillsSelector
                      // Convert array of names back to {id, name} for display if needed,
                      // or adapt SkillsSelector to work directly with names.
                      // For simplicity, let's assume SkillsSelector needs {id, name} array
                      // We map the names from the form state to a temporary structure for the component
                      selectedSkills={
                        field.value?.map((name) => ({
                          id:
                            userProfile?.skills?.find(
                              (s: SkillData) => s.name === name
                            )?.id || `temp_${name}`, // Find existing ID or use name as temp key
                          name: name,
                        })) || []
                      }
                      onChange={(newSkills) => {
                        // Update the form state with just the names
                        field.onChange(newSkills.map((s) => s.name));
                      }}
                      disabled={mutation.isPending}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* --- Submit Button --- */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={mutation.isPending || !form.formState.isDirty} // Disable if saving or no changes
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
