// components/profile/ProfileHeader.tsx
"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { type UserProfile, type ProfileFormData } from "@/types/user"; // Adjust path
import { getInitials } from "@/lib/utils/helpers"; // Adjust path

interface ProfileHeaderProps {
  user: UserProfile;
  isEditing: boolean;
  formData: ProfileFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditToggle: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isEditing,
  formData,
  onInputChange,
  onEditToggle,
  onCancel,
  isSaving,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
      <Avatar className="h-24 w-24 border-2 border-primary shrink-0">
        <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
        <AvatarFallback className="text-3xl">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-grow text-center sm:text-left">
        {isEditing ? (
          <div className="mb-1">
            <Label htmlFor="name" className="sr-only">
              Name
            </Label>{" "}
            {/* Screen reader only */}
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              placeholder="Your Name"
              className="text-3xl font-bold p-0 border-0 h-auto shadow-none focus-visible:ring-0 bg-transparent"
            />
          </div>
        ) : (
          <h1 className="text-3xl font-bold">{user.name || "User"}</h1>
        )}
        <p className="text-muted-foreground">{user.email}</p>
        {user.createdAt && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center sm:justify-start">
            <CalendarDays className="h-4 w-4 mr-1.5" />
            Member since {format(new Date(user.createdAt), "MMMM yyyy")}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={onEditToggle}>
            Edit Profile
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
