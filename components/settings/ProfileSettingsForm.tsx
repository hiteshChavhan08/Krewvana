// components/settings/ProfileSettingsForm.tsx
"use client";

import React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type UserProfile } from '@/types/user'; // Adjust path

// Schema for just the basic fields editable here
const BasicProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100).trim(),
  hobbies: z.string().max(500).optional().or(z.literal("")),
  favoriteFood: z.string().max(100).optional().or(z.literal("")),
  askMeAbout: z.string().max(200).optional().or(z.literal("")),
});
export type BasicProfileFormValues = z.infer<typeof BasicProfileSchema>;

interface ProfileSettingsFormProps {
    // Pass the form instance created in the parent page
    form: UseFormReturn<any>; // Use 'any' or create a combined settings schema type
    disabled?: boolean;
}

export const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({ form, disabled }) => {
    return (
        // The <Form> wrapper is provided by the parent page
         <div className="space-y-4">
             {/* Name Field */}
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                    <Input placeholder="Your Name" {...field} disabled={disabled} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            {/* Hobbies Field */}
             <FormField
                control={form.control}
                name="hobbies"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Hobbies</FormLabel>
                    <FormControl>
                    <Textarea placeholder="What do you enjoy doing?" {...field} disabled={disabled} maxLength={500} className="min-h-[80px]" />
                    </FormControl>
                    <FormMessage />
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
                    <Input placeholder="What's delicious?" {...field} disabled={disabled} maxLength={100}/>
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
                    <Input placeholder="e.g., dogs, baking, specific project..." {...field} disabled={disabled} maxLength={200}/>
                    </FormControl>
                     <FormDescription className="text-xs">Help others connect with you.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
         </div>
    );
};