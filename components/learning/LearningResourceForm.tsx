// components/learning/LearningResourceForm.tsx
"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LearningResourceCreateSchema,
  LearningResourceCreateData,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// Card components might not be needed if the form is in a Dialog, but DialogHeader/Title can be used.
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { BackgroundGradient } from '@/components/ui/aceternity/background-gradient'; // Not needed if in Dialog
import { useSubmitLearningResource } from "@/hooks/learning/useSubmitLearningResource";

interface LearningResourceFormProps {
  onSubmissionComplete?: () => void; // Callback to run after successful submission
}

export function LearningResourceForm({
  onSubmissionComplete,
}: LearningResourceFormProps) {
  const form = useForm<LearningResourceCreateData>({
    resolver: zodResolver(LearningResourceCreateSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
    },
  });

  const mutation = useSubmitLearningResource();

  const onSubmit = (data: LearningResourceCreateData) => {
    mutation.mutate(data, {
      onSuccess: (createdResource) => {
        // The hook's onSuccess (toast, invalidateQueries) will also run
        form.reset(); // Reset form fields
        onSubmissionComplete?.(); // Call the callback to close modal or perform other actions
      },
      // onError is handled by the hook
    });
  };

  return (
    // Removed BackgroundGradient and Card, as Dialog will provide the container
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Advanced TypeScript Patterns"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/resource"
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Briefly describe why it's useful..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Submitting..." : "Submit Resource"}
        </Button>
      </form>
    </Form>
  );
}
