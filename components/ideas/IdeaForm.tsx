// components/ideas/IdeaForm.tsx
"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdeaCreateSchema, IdeaCreateData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSubmitIdea } from "@/hooks/ideas/useSubmitIdea";
import { TagInput } from "../qna/tag-input";
// Potentially add Select for category if you want predefined categories
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IdeaFormProps {
  onSubmissionComplete?: () => void;
  // Example categories, you might fetch these or define them elsewhere
  //   categories?: string[];
}

export function IdeaForm({ onSubmissionComplete }: IdeaFormProps) {
  const form = useForm<IdeaCreateData>({
    resolver: zodResolver(IdeaCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      category: [],
    },
  });

  const mutation = useSubmitIdea();

  const onSubmit = (data: IdeaCreateData) => {
    console.log("[IdeaForm] Raw form data:", JSON.stringify(data, null, 2));
    const dataToSubmit = { ...data, category: data.category || [] };
    console.log(
      "[IdeaForm] Data being sent to API:",
      JSON.stringify(dataToSubmit, null, 2)
    ); // <<< ADD THIS LOG
    mutation.mutate(dataToSubmit, {
      onSuccess: () => {
        form.reset(); // This will reset category back to []
        onSubmissionComplete?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idea Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Monthly Innovation Challenges"
                  {...field}
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
        {/* --- NEW TagInput for Category --- */}
        <FormField
          control={form.control}
          name="category" // This name must match the one in IdeaCreateData and defaultValues
          render={(
            { field } // field contains { onChange, onBlur, value, name, ref }
          ) => (
            <FormItem>
              <FormLabel>Categories / Tags (Optional)</FormLabel>
              <FormControl>
                <TagInput
                  // Spread the field props from react-hook-form
                  // This will pass down value, onChange, onBlur, name, ref
                  {...field}
                  // TagInput expects value: string[] and onChange: (newValue: string[]) => void
                  // field.value from RHF for an array field will be string[]
                  // field.onChange from RHF will correctly update the form state with string[]
                  value={field.value || []} // Ensure value is always an array for TagInput
                  onChange={field.onChange} // Pass RHF's onChange
                  placeholder="Add up to 5 tags..."
                  maxTags={5} // Should match your Zod schema
                  // You can customize classNames for the TagInput itself or its internal parts
                  // className="mt-1"
                  // inputClassName="..."
                  // badgeClassName="..."
                />
              </FormControl>
              <FormDescription>
                Press Enter or comma to add a tag. Helps in organizing ideas.
              </FormDescription>
              <FormMessage />{" "}
              {/* Displays validation errors for the category field */}
            </FormItem>
          )}
        />
        {/* --- End TagInput for Category --- */}
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Submitting Idea..." : "Pitch My Idea"}
        </Button>
      </form>
    </Form>
  );
}
