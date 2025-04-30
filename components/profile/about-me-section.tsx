// components/profile/AboutMeSection.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components from shadcn/ui
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Types and Schemas (adjust paths as needed)
import { type UserProfile } from "@/types/user";
import { ClientProfileUpdateSchema } from "@/lib/schemas";

// Define the type based on the Zod schema for form values
type ProfileFormValues = z.infer<typeof ClientProfileUpdateSchema>;

// --- Component Props ---
interface AboutMeSectionProps {
  user: UserProfile;              // The user data to display/edit
  isEditing: boolean;             // Controls whether the form or display view is shown
  onSubmit: (values: ProfileFormValues) => void; // Function to call with validated data on save
  isSaving: boolean;              // Indicates if the save operation is in progress (for button state)
  renderContainer?: boolean;     // If false, omits the <Card> wrapper (for Bento Grid)
}

// --- Helper Component for Display Mode ---
const DisplayField = ({ label, value }: { label: string; value: string | null }) => (
    <div>
      {/* Using Label for semantic meaning, but styling as muted text */}
      <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
      <p className="mt-0.5 whitespace-pre-wrap text-sm"> {/* Ensure consistent text size */}
        {value && value.trim() // Check if value exists and is not just whitespace
            ? value
            : <span className="italic text-muted-foreground/70">Not specified</span>
        }
      </p>
    </div>
);


// --- Main Component ---
export const AboutMeSection: React.FC<AboutMeSectionProps> = ({
  user,
  isEditing,
  onSubmit,
  isSaving,
  renderContainer = true, // Default to rendering the Card container
}) => {

  // --- React Hook Form Setup ---
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ClientProfileUpdateSchema),
    // Set default values based on the user prop
    defaultValues: {
      name: user?.name || "", // Include name if it's part of the schema/form
      hobbies: user?.hobbies || "",
      favoriteFood: user?.favoriteFood || "",
      askMeAbout: user?.askMeAbout || "",
    },
    mode: "onChange", // Provide validation feedback as the user types
  });

  // --- Effect to reset form values when user data changes or edit mode toggles ---
  // This ensures the form reflects the latest profile data when editing starts
  // and resets any unsaved changes when editing is cancelled.
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "", // Reset name as well
        hobbies: user.hobbies || "",
        favoriteFood: user.favoriteFood || "",
        askMeAbout: user.askMeAbout || "",
      });
    }
  // Only reset when the user data actually changes or when edit mode is toggled OFF
  // Avoid resetting *while* editing if only `isEditing` changes to true initially
  }, [user, form.reset, isEditing]);


  // --- Core Content JSX (Form or Display Fields) ---
  const content = (
     // Add slight padding if NOT rendering the container, otherwise CardContent handles padding
     // Increased padding slightly for better spacing when containerless
     <div className={renderContainer ? "" : "p-2"}>
        {isEditing ? (
          // --- Edit Form View ---
          <Form {...form}>
            {/* form.handleSubmit correctly wraps our passed onSubmit function */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Hobbies Field */}
              <FormField
                control={form.control}
                name="hobbies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hobbies</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What do you enjoy doing outside of work?"
                        className="min-h-[80px] resize-y" // Allow vertical resize
                        maxLength={500} // Match schema
                        {...field} // Connects input state, onChange, onBlur, etc.
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                        Share some of your interests.
                    </FormDescription>
                    <FormMessage /> {/* Displays validation errors for this field */}
                  </FormItem>
                )}
              />

              {/* Favorite Food Field */}
              <FormField
                control={form.control}
                name="favoriteFood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Food(s)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What makes your taste buds happy?"
                        maxLength={100} // Match schema
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ask Me About Field */}
              <FormField
                control={form.control}
                name="askMeAbout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ask Me About</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tech interests, projects, fun facts..."
                        maxLength={200} // Match schema
                        {...field}
                      />
                    </FormControl>
                     <FormDescription className="text-xs">
                        Help others connect with you on shared interests.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isDirty} // Disable if saving or no changes made
                size="sm" // Make button slightly smaller
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        ) : (
          // --- Display View ---
          <div className="space-y-4"> {/* Consistent spacing */}
            <DisplayField label="Hobbies" value={user?.hobbies} />
            <DisplayField label="Favorite Food(s)" value={user?.favoriteFood} />
            <DisplayField label="Ask Me About" value={user?.askMeAbout} />
          </div>
        )}
     </div>
  );

  // --- Conditional Rendering of Container ---
  if (renderContainer) {
      // Render with Card container (default behavior)
      return (
         <Card> {/* Layout class (like md:col-span-2) should be applied by parent */}
            <CardHeader>
                <CardTitle>About Me</CardTitle>
                {/* Watch form name only if editing, otherwise use user name */}
                <CardDescription>
                    A little more about {isEditing ? (form.watch("name") || user?.name || "me") : (user?.name || "me")}.
                </CardDescription>
            </CardHeader>
            <CardContent>{content}</CardContent>
         </Card>
      );
  } else {
      // Render just the content (for Bento Grid integration)
      return content;
  }
};

// Ensure default export if this is the only export in the file
// export default AboutMeSection;