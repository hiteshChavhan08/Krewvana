// components/ideas/IdeaForm.tsx
"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IdeaUnifiedFormData,
  IdeaFormCreateValidationSchema,
  IdeaFormUpdateValidationSchema,
  // IdeaStatus, // Import if you use the status field for admins
} from "@/lib/schemas";
import { IdeaDetail } from "@/hooks/ideas/useIdeas";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button"; // Changed from react-day-picker
import { Input } from "@/components/ui/input"; // Changed from ../plate-ui/input
import { TagInput } from "@/components/qna/tag-input"; // Changed from ../qna/tag-input
import { Textarea } from "@/components/ui/textarea"; // Changed from ../ui/textarea
// import { useCurrentUser } from "@/hooks/useCurrentUser"; // If needed for admin status field
// import { UserRole } from "@prisma/client"; // If needed for admin status field
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For status

interface IdeaFormProps {
  onSubmissionComplete: (data: Partial<IdeaUnifiedFormData>) => void;
  existingIdea?: IdeaDetail | null;
  isEditing?: boolean;
}

export function IdeaForm({
  onSubmissionComplete,
  existingIdea,
  isEditing = false,
}: IdeaFormProps) {
  // const currentUser = useCurrentUser(); // Uncomment if using for admin status field

  const formSchemaForValidation = isEditing
    ? IdeaFormUpdateValidationSchema
    : IdeaFormCreateValidationSchema;

  const form = useForm<IdeaUnifiedFormData>({
    resolver: zodResolver(formSchemaForValidation),
    defaultValues: {
      title: existingIdea?.title || "",
      description: existingIdea?.description || "",
      category: existingIdea?.category || [],
      status: (existingIdea?.status as any) || undefined, // Cast 'any' if IdeaStatus from Prisma doesn't align directly with string from schema
      // Or ensure existingIdea.status is compatible with IdeaUnifiedFormData.status type
    },
  });

  useEffect(() => {
    if (isEditing && existingIdea) {
      form.reset({
        title: existingIdea.title,
        description: existingIdea.description,
        category: existingIdea.category || [],
        status: (existingIdea.status as any) || undefined,
      });
    } else if (!isEditing) {
      form.reset({
        title: "",
        description: "",
        category: [],
        status: undefined,
      });
    }
  }, [existingIdea, isEditing, form]); // 'form' is stable, no need to list 'form.reset'

  const onSubmit = (data: IdeaUnifiedFormData) => {
    // data here is validated by either Create or Update schema
    // It will be Partial<IdeaUnifiedFormData> where some fields might be undefined if editing
    onSubmissionComplete(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Idea Title{" "}
                {!isEditing && <span className="text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Monthly Innovation Challenges"
                  {...field}
                  value={field.value ?? ""} // Handle undefined for controlled input
                />
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
              <FormLabel>
                Detailed Description{" "}
                {!isEditing && <span className="text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Explain your idea, its benefits, and potential implementation..."
                  {...field}
                  value={field.value ?? ""} // Handle undefined for controlled input
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories / Tags (Optional)</FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add up to 5 tags..."
                  maxTags={5}
                />
              </FormControl>
              <FormDescription>
                Press Enter or comma to add a tag.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional: Status field for Admins if isEditing */}
        {/* {isEditing && currentUser?.role === UserRole.ADMIN && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(IdeaStatus).map((s) => ( // Assuming IdeaStatus is your Prisma enum
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )} */}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting} // Use form.formState.isSubmitting
          className="w-full"
        >
          {form.formState.isSubmitting
            ? isEditing
              ? "Saving..."
              : "Submitting..."
            : isEditing
            ? "Save Changes"
            : "Pitch My Idea"}
        </Button>
      </form>
    </Form>
  );
}
