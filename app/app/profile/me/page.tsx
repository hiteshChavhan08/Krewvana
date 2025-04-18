// app/app/profile/me/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Star, Award, CalendarDays, Terminal } from "lucide-react"; // Icons
import { format } from "date-fns"; // Date formatting

// Import Magic UI components (adjust path if you placed them elsewhere)
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils"; // Ensure cn is available
import { Badge as ShadcnBadge } from "@/components/ui/badge"; // Renamed import to avoid conflict if needed// Import Badge component
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip
import { Send, HeartHandshake, Sparkles, HelpCircle } from "lucide-react"; // Import badge icons
import { Button } from "@/components/ui/button"; // Import Button
import { Input } from "@/components/ui/input"; // Import Input
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Label } from "@/components/ui/label"; // Import Label
import { toast } from "sonner"; // For notifications
import { z, ZodError } from "zod"; // For client-side validation check (optional)

type BadgeData = {
  // Define type for the nested badge data
  id: string;
  name: string;
  description: string;
  iconName: string | null;
};

type UserBadgeData = {
  // Define type for items in the userBadges array
  earnedAt: string;
  badge: BadgeData;
};

type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  points: number;
  createdAt: string;
  hobbies: string | null; // Add new fields
  favoriteFood: string | null;
  askMeAbout: string | null;
  userBadges?: UserBadgeData[]; // Use the defined type here
};

type ProfileFormData = {
  name: string;
  hobbies: string;
  favoriteFood: string;
  askMeAbout: string;
};
// --- End Type Definitions ---
// Helper function for initials
function getInitials(name?: string | null): string {
  if (!name) return "?";
  const names = name.split(" ");
  if (names.length === 1) return names[0].substring(0, 1).toUpperCase();
  return (
    names[0].substring(0, 1) + names[names.length - 1].substring(0, 1)
  ).toUpperCase();
}

// --- API Fetch Function ---
async function fetchUserProfile(): Promise<any> {
  // Use UserProfile type later
  const response = await fetch("/api/users/me");
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return response.json();
}
async function updateUserProfile(
  data: Partial<ProfileFormData>
): Promise<UserProfile> {
  // Use Partial for updates
  const response = await fetch("/api/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.details?.[0]?.message ||
        errorData.error ||
        "Failed to update profile"
    );
  }
  return response.json();
}
// --- Icon Mapping Helper ---
const BadgeIcon = ({
  iconName,
  className,
}: {
  iconName: string | null;
  className?: string;
}) => {
  const sizeClass = className || "h-4 w-4"; // Default size
  switch (iconName) {
    case "Send":
      return <Send className={sizeClass} />;
    case "HeartHandshake":
      return <HeartHandshake className={sizeClass} />;
    case "Sparkles":
      return <Sparkles className={sizeClass} />;
    // Add more cases for future badge icons
    default:
      return <HelpCircle className={sizeClass} />; // Default icon
  }
};
const ClientProfileUpdateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100),
  hobbies: z
    .string()
    .max(500, "Hobbies text too long")
    .optional()
    .or(z.literal("")),
  favoriteFood: z
    .string()
    .max(100, "Favorite food text too long")
    .optional()
    .or(z.literal("")),
  askMeAbout: z
    .string()
    .max(200, "Ask me about text too long")
    .optional()
    .or(z.literal("")),
});
export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession(); // Get session for query key if needed
  const userId = session?.user?.id;
  const [isEditing, setIsEditing] = useState(false);
  // State to hold form data during editing
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    hobbies: "",
    favoriteFood: "",
    askMeAbout: "",
  });

  const {
    data: user,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery<any>({
    // Use UserProfile type later
    // Query key includes userId to refetch if user changes (though unlikely here)
    queryKey: ["userProfile", userId],
    queryFn: fetchUserProfile,
    enabled: !!userId, // Only run query if userId is available
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedData) => {
      toast.success("Profile Updated!");
      // Update the query cache with the new data
      queryClient.setQueryData(
        ["userProfile", userId],
        (oldData: UserProfile | undefined) => ({ ...oldData, ...updatedData })
      );
      setIsEditing(false); // Exit edit mode
    },
    onError: (error: Error) => {
      toast.error("Update Failed", { description: error.message });
    },
  });
  // --- Effect to populate form when editing starts or user data loads ---
  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        name: user.name || "",
        hobbies: user.hobbies || "",
        favoriteFood: user.favoriteFood || "",
        askMeAbout: user.askMeAbout || "",
      });
    }
  }, [isEditing, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side validation (optional, backend validates anyway)
    try {
      ClientProfileUpdateSchema.parse(formData);
      // Prepare data for PUT (only send changed fields potentially, or all)
      const dataToUpdate: Partial<ProfileFormData> = {};
      if (formData.name !== (user?.name || ""))
        dataToUpdate.name = formData.name;
      if (formData.hobbies !== (user?.hobbies || ""))
        dataToUpdate.hobbies = formData.hobbies;
      if (formData.favoriteFood !== (user?.favoriteFood || ""))
        dataToUpdate.favoriteFood = formData.favoriteFood;
      if (formData.askMeAbout !== (user?.askMeAbout || ""))
        dataToUpdate.askMeAbout = formData.askMeAbout;

      if (Object.keys(dataToUpdate).length > 0) {
        mutation.mutate(dataToUpdate);
      } else {
        toast.info("No changes detected.");
        setIsEditing(false); // Exit edit mode if no changes
      }
    } catch (err: any) {
      if (err instanceof ZodError) {
        toast.error("Validation Error", { description: err.errors[0].message });
      } else {
        toast.error("Validation Error", { description: "Invalid data." });
      }
    }
  };
  if (isLoading || !userId) {
    // Elegant Skeleton Loader
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-32" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-lg">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load your profile. Please try again later. (
            {error?.message})
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (!isLoading && !isError && !user) {
    return (
      <div className="container mx-auto py-8 px-4">User data not found.</div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">User data not found.</div>
    ); // Should ideally not happen if query enabled correctly
  }

  return (
    <div className="relative container mx-auto py-8 px-4 max-w-4xl overflow-hidden">
      {/* Magic UI Background */}
      <DotPattern
        width={30}
        height={30}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] ",
          "absolute inset-0 z-0" // Ensure it's behind content
        )}
      />

      {/* Profile Content (Ensure z-index higher than pattern) */}
      <div className="relative z-10 space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "User"}
            />
            <AvatarFallback className="text-3xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            {/* Display Name or Input */}
            {isEditing ? (
              <div className="mb-2">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="text-3xl font-bold p-0 border-0 h-auto shadow-none focus-visible:ring-0"
                />
              </div>
            ) : (
              <h1 className="text-3xl font-bold">{user?.name || "User"}</h1>
            )}
            <p className="text-muted-foreground">{user?.email}</p>
            {user.createdAt && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center">
                <CalendarDays className="h-4 w-4 mr-1.5" />
                Member since {format(new Date(user.createdAt), "MMMM yyyy")}
              </p>
            )}
          </div>
          {/* Edit/Cancel Buttons */}
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Grid for Points and Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Points Card */}
          <Card className="overflow-hidden">
            {" "}
            {/* Add overflow hidden for shiny text */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Points
              </CardTitle>
              <Star className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {/* Magic UI Animated Shiny Text for Points */}
              <div
                className={cn(
                  "z-10 flex items-center justify-center" // Centering if needed
                  // Background can be added for more contrast if desired
                  // "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg"
                )}
              >
                <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                  {/* Apply large text size directly */}
                  <span className="text-5xl font-bold tracking-tighter">
                    {user.points?.toLocaleString() ?? 0}
                  </span>
                </AnimatedShinyText>
              </div>
            </CardContent>
          </Card>

          {/* --- Badges Card (Updated) --- */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Earned Badges
              </CardTitle>
              <Award className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              {user?.userBadges && user.userBadges.length > 0 ? (
                <TooltipProvider delayDuration={100}>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {user.userBadges.map((UserBadge: UserBadgeData) => (
                      <Tooltip key={UserBadge.badge.id}>
                        <TooltipTrigger>
                          <ShadcnBadge
                            variant="secondary"
                            className="flex items-center gap-1.5 cursor-default px-2 py-1"
                          >
                            <BadgeIcon
                              iconName={UserBadge.badge.iconName}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs">
                              {UserBadge.badge.name}
                            </span>
                          </ShadcnBadge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-center">
                          <p className="font-semibold">
                            {UserBadge.badge.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {UserBadge.badge.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned: {format(new Date(UserBadge.earnedAt), "PP")}
                          </p>{" "}
                          {/* Pretty date */}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              ) : (
                <p className="text-sm text-muted-foreground pt-2">
                  No badges earned yet. Keep contributing!
                </p>
              )}
            </CardContent>
          </Card>
          {/* --- End Badges Card --- */}

          {/* --- "Get to Know Me" Card --- */}
          <Card className="md:col-span-2">
            {" "}
            {/* Span both columns */}
            <CardHeader>
              <CardTitle>About Me</CardTitle>
              <CardDescription>
                A little more about{" "}
                {isEditing ? formData.name : user?.name || "me"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                // --- Edit Form ---
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <Label htmlFor="hobbies">Hobbies</Label>
                    <Textarea
                      id="hobbies"
                      name="hobbies"
                      value={formData.hobbies}
                      onChange={handleInputChange}
                      placeholder="What do you enjoy doing?"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="favoriteFood">Favorite Food(s)</Label>
                    <Input
                      id="favoriteFood"
                      name="favoriteFood"
                      value={formData.favoriteFood}
                      onChange={handleInputChange}
                      placeholder="What's delicious?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="askMeAbout">Ask Me About</Label>
                    <Input
                      id="askMeAbout"
                      name="askMeAbout"
                      value={formData.askMeAbout}
                      onChange={handleInputChange}
                      placeholder="e.g., dogs, baking, specific project..."
                    />
                  </div>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              ) : (
                // --- Display View ---
                <div className="space-y-4 text-sm">
                  <div>
                    <Label className="font-semibold text-muted-foreground">
                      Hobbies
                    </Label>
                    <p className="whitespace-pre-wrap">
                      {user?.hobbies || (
                        <span className="italic text-muted-foreground/70">
                          Not specified
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">
                      Favorite Food(s)
                    </Label>
                    <p>
                      {user?.favoriteFood || (
                        <span className="italic text-muted-foreground/70">
                          Not specified
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">
                      Ask Me About
                    </Label>
                    <p>
                      {user?.askMeAbout || (
                        <span className="italic text-muted-foreground/70">
                          Not specified
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Other sections can be added later (e.g., Activity Feed) */}
      </div>
    </div>
  );
}
