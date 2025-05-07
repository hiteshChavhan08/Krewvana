// components/admin/CategoryForm.tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { CategorySchema } from "@/services/categoryService"; // Import schema
import { type KudosAppreciationCategory } from "@prisma/client"; // Import type

// Type for form values
type CategoryFormValues = z.infer<typeof CategorySchema>;

interface CategoryFormProps {
  initialData?: KudosAppreciationCategory | null; // For editing
  onSubmit: (values: CategoryFormValues) => Promise<void>; // Async submit handler
  onCancel: () => void;
  isSubmitting: boolean; // Pass submitting state from mutation
}

export function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: CategoryFormProps) {

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      iconName: initialData?.iconName ?? "",
    },
  });

  const handleFormSubmit = async (values: CategoryFormValues) => {
    await onSubmit(values);
    // Resetting form might happen in parent component via key prop or on success callback
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Teamwork" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                {/* Handle null value for textarea */}
                <Textarea placeholder="Briefly describe the category..." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="iconName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon Name (Optional)</FormLabel>
              <FormControl>
                 {/* Handle null value for input */}
                <Input placeholder="e.g., Users, Star (from Lucide)" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}