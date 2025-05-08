// components/ideas/IdeaForm.tsx
"use client";
import React, { useEffect } from "react"; // Added useEffect
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Import both schemas if the form handles create and update based on a prop
import {
  IdeaUnifiedFormData, // For useForm<T>
  IdeaFormCreateValidationSchema, // For resolver on create
  IdeaFormUpdateValidationSchema,
} from "@/lib/schemas";
// ... (other imports: Button, Input, Textarea, Form components, TagInput)
import { IdeaDetail } from "@/hooks/ideas/useIdeas"; // For existingIdea prop
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "react-day-picker";
import { Input } from "../plate-ui/input";
import { TagInput } from "../qna/tag-input";
import { Textarea } from "../ui/textarea";

interface IdeaFormProps {
  // Callback now receives data matching the validation schema used
  onSubmissionComplete: (data: Partial<IdeaUnifiedFormData>) => void;
  existingIdea?: IdeaDetail | null;
  isEditing?: boolean;
}

export function IdeaForm({
  onSubmissionComplete,
  existingIdea,
  isEditing = false,
}: IdeaFormProps) {
  const formSchemaForValidation = isEditing
    ? IdeaFormUpdateValidationSchema
    : IdeaFormCreateValidationSchema;

  const form = useForm<IdeaUnifiedFormData>({
    // Use the unified, all-optional type for form state
    resolver: zodResolver(formSchemaForValidation), // Resolver uses the specific schema
    defaultValues: {
      // Default values should match IdeaUnifiedFormData (all optional)
      title: existingIdea?.title || "",
      description: existingIdea?.description || "",
      category: existingIdea?.category || [],
      // status: existingIdea?.status,
    },
  });

  useEffect(() => {
    if (isEditing && existingIdea) {
      form.reset({
        // Values here should match IdeaUnifiedFormData
        title: existingIdea.title,
        description: existingIdea.description,
        category: existingIdea.category || [],
        // status: existingIdea.status,
      });
    } else if (!isEditing) {
      form.reset({
        title: "",
        description: "",
        category: [],
        status: undefined,
      });
    }
  }, [existingIdea, isEditing, form]);

  // The mutation is handled by the parent now. This form just calls onSubmissionComplete.
  // const mutation = useSubmitIdea(); // Remove this if parent handles mutation

  const onSubmit = (data: IdeaUnifiedFormData) => {
    onSubmissionComplete(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        {/* ... FormFields for title, description, category ... */}
        {/* Example for Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              {/* For visual cue, check if it's required in the base shape */}
              <FormLabel>
                Idea Title{" "}
                {!isEditing && <span className="text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Monthly Innovation Challenges"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />{" "}
              {/* Will show errors from the active validation schema */}
            </FormItem>
          )}
        />
        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Explain your idea, its benefits, and potential implementation..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Category/TagInput Field */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories / Tags (Optional)</FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  value={(field.value as string[] | undefined) || []} // Ensure value is string[]
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

        {/* Optional: Status field for Admins if isEditing and user is Admin */}
        {/* {isEditing && currentUser?.role === UserRole.ADMIN && ( ... Status Select Field ... )} */}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
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
