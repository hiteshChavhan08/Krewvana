// app/app/profile/me/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Star, Award, UserCircle, Activity } from "lucide-react"; // Added UserCircle, Activity icons
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";

// Import API functions and types
import { fetchUserProfile, updateUserProfile } from "@/lib/api/userApi";
import { type UserProfile, type ProfileFormData } from "@/types/user";
import { ClientProfileUpdateSchema } from "@/lib/schemas";
type ProfileFormValues = z.infer<typeof ClientProfileUpdateSchema>;

// Import Sub-Components
import { ProfileHeader } from "@/components/profile/profile-header";
import { PointsCard } from "@/components/profile/points-card";
import { BadgesCard } from "@/components/profile/badges-card";
import { AboutMeSection } from "@/components/profile/about-me-section";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"; // Import Bento Grid
import { BadgesList } from "@/components/profile/BadgesList";
import { PointsDisplay } from "@/components/profile/PointsDisplay";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [isEditing, setIsEditing] = useState(false);

  // --- Data Fetching ---
  const {
    data: user,
    isLoading: isUserLoading,
    error,
    isError,
  } = useQuery<UserProfile>({
    queryKey: ["userProfile", userId],
    queryFn: fetchUserProfile,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  // --- Data Mutation ---
  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedData) => {
      toast.success("Profile Updated!");
      queryClient.setQueryData(
        ["userProfile", userId],
        (oldData: UserProfile | undefined) =>
          oldData ? { ...oldData, ...updatedData } : updatedData
      );
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error("Update Failed", { description: error.message });
    },
  });

  // --- Handlers ---
  const handleProfileSubmit = (values: ProfileFormValues) => {
    // Logic remains the same - finds differences and calls mutation
    const dataToUpdate: Partial<ProfileFormValues> = {};
    const trimmedName = values.name.trim();
    if (trimmedName !== (user?.name || "")) dataToUpdate.name = trimmedName;
    if (values.hobbies !== (user?.hobbies || ""))
      dataToUpdate.hobbies = values.hobbies;
    if (values.favoriteFood !== (user?.favoriteFood || ""))
      dataToUpdate.favoriteFood = values.favoriteFood;
    if (values.askMeAbout !== (user?.askMeAbout || ""))
      dataToUpdate.askMeAbout = values.askMeAbout;
    if (Object.keys(dataToUpdate).length > 0) {
      mutation.mutate(dataToUpdate);
    } else {
      toast.info("No changes detected to save.");
      setIsEditing(false);
    }
  };

  const handleEditToggle = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);

  // --- Render Logic ---
  if (isUserLoading || status === "loading") {
    return <ProfileSkeleton />; // Use the updated Bento skeleton
  }
  // ... (Error and No User states remain the same) ...
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        User data not found or you might need to sign in.
      </div>
    );
  }

  // --- Main Render with Bento Grid ---
  return (
    // Ensure the main container allows scrolling if content exceeds viewport height
    // Adding min-h-screen and flex-col might help ensure layout fills screen
    <div className="relative container mx-auto py-4 px-4 max-w-4xl min-h-screen flex flex-col">
      {/* Header - Place above the Bento Grid */}
      <div className="relative z-10 mb-8">
        {/* ProfileHeader needs its own state/input handler if name is edited there */}
        <ProfileHeader
          user={user}
          isEditing={isEditing}
          formData={{
            name: user.name || "",
            hobbies: "",
            favoriteFood: "",
            askMeAbout: "",
          }} // Pass minimal data if name not edited here
          onInputChange={() => {}}
          onEditToggle={handleEditToggle}
          onCancel={handleCancel}
          isSaving={mutation.isPending}
        />
      </div>

      {/* Bento Grid */}
      {/* Adjust row height as needed */}
      <BentoGrid className="max-w-4xl mx-auto auto-rows-auto md:auto-rows-[14rem] flex-grow pb-8">
        {/* Points Item - Render PointsDisplay in header */}
        <BentoGridItem
          key="points"
          // Title can be simpler now as number is prominent
          title="Total Points"
          // No description needed
          header={
            // Vertically center the points display within the available header space
            <div className="flex flex-col items-center justify-center h-full w-full">
              <PointsDisplay points={user.points} />
            </div>
          }
          icon={<Star className="h-4 w-4 text-neutral-500" />}
          // Adjust item padding/alignment if needed via className
          className="md:col-span-1 flex flex-col" // Override padding for full control, use flex
        />
        {/* Badges Item - Render BadgesList in header */}
        <BentoGridItem
          key="badges"
          title="Earned Badges"
          description="Your achievements collection."
          header={
            // BadgesList now returns the content directly
            // Add padding within the header div if BadgesList doesn't have it
            <div className="p-4 h-full w-full overflow-y-auto">
              {/* {" "} */}
              {/* Allow scroll if many badges */}
              <BadgesList userBadges={user.userBadges} />
            </div>
          }
          icon={<Award className="h-4 w-4 text-neutral-500" />}
          className="md:col-span-1 flex flex-col" // Override padding
        />

        {/* Placeholder Item 1 (Optional) */}
        <BentoGridItem
          key="placeholder1"
          title="Activity Feed"
          description="Recent contributions and interactions."
          header={
            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-dot-pattern items-center justify-center text-muted-foreground text-sm">
              Coming Soon...
            </div>
          }
          icon={<Activity className="h-4 w-4 text-neutral-500" />}
          className="md:col-span-1"
        />

        {/* About Me Item - Render AboutMeSection (without container) in header */}
        <BentoGridItem
          key="about-me"
          title="About Me"
          description={
            isEditing ? "Update your details." : "A little more about me."
          }
          header={
            <div className="p-4 h-full w-full overflow-y-auto">
              {" "}
              {/* Allow scroll for form */}
              <AboutMeSection
                user={user}
                isEditing={isEditing}
                onSubmit={handleProfileSubmit}
                isSaving={mutation.isPending}
                renderContainer={false} // Important: Tell component not to render Card
              />
            </div>
          }
          icon={<UserCircle className="h-4 w-4 text-neutral-500" />}
          className="md:col-span-2 md:row-span-2 flex flex-col" // Span, override padding
        />

        {/* Placeholder Item 2 (Optional) */}
        <BentoGridItem
          key="placeholder2"
          title="My Contributions"
          description="Questions asked, answers provided, etc."
          header={
            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-dot-pattern items-center justify-center text-muted-foreground text-sm">
              Coming Soon...
            </div>
          }
          icon={<Activity className="h-4 w-4 text-neutral-500" />}
          className="md:col-span-1 md:row-span-2" // Span 2 rows to fill space
        />
      </BentoGrid>
    </div>
  );
}
