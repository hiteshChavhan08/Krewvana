// src/components/ama-session/ama-question-input.tsx
"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text"; // Magic UI example
import { cn } from "@/lib/utils";

interface AmaQuestionInputProps {
  sessionId: string;
  onQuestionSubmitted: () => void; // Callback to trigger refresh in parent
}

const questionFormSchema = z.object({
  text: z
    .string()
    .min(5, "Question must be at least 5 characters long.")
    .max(1000, "Question cannot exceed 1000 characters."),
  isAnonymous: z.boolean().optional(),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

export function AmaQuestionInput({
  sessionId,
  onQuestionSubmitted,
}: AmaQuestionInputProps) {
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: "",
      isAnonymous: false,
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = form;

  const onSubmit: SubmitHandler<QuestionFormData> = async (data) => {
    const toastId = toast.loading("Submitting question...");
    try {
      const response = await fetch(`/api/ama/sessions/${sessionId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to submit question" }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      const newQuestion = await response.json();
      toast.success("Question submitted successfully!", { id: toastId });
      reset(); // Clear the form
      onQuestionSubmitted(); // Notify parent to refresh list
    } catch (error: any) {
      console.error("Error submitting question:", error);
      toast.error(`Failed to submit: ${error.message}`, { id: toastId });
    }
  };

  return (
    <Card>
      <CardHeader>
        {/* Magic UI AnimatedShinyText Example */}
        <div
          className={cn(
            "group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800",
            "w-fit px-4 py-1.5" // Make it fit content
          )}
        >
          <AnimatedShinyText className="inline-flex items-center justify-center text-lg font-medium text-neutral-800 transition-all dark:text-neutral-200">
            <span>✨ Ask a Question</span>
          </AnimatedShinyText>
        </div>
        {/* <CardTitle>Ask a Question</CardTitle> */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your question here..."
                      rows={4}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Submit Anonymously</FormLabel>
                    <FormDescription>
                      If checked, your name will not be displayed with the
                      question.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit Question
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
