// app/app/qna/ask/page.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Value } from "@udecode/plate";
import { DndProvider } from "react-dnd"; // Import DndProvider
import { HTML5Backend } from "react-dnd-html5-backend"; // Import Backend
import { Plate } from "@udecode/plate/react"; // Import Plate

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  CreateQuestionSchema,
  CreateQuestionInput,
} from "@/lib/validations/qna";
import { createQuestion } from "@/lib/actions/qna";
import { TagInput } from "@/components/qna/tag-input";
import { useCreateEditor } from "@/components/editor/use-create-editor";
import { Editor, EditorContainer } from "@/components/plate-ui/editor"; // Import Editor UI
import { FixedToolbar } from "@/components/plate-ui/fixed-toolbar"; // Import Toolbar UI
import { FixedToolbarButtons } from "@/components/plate-ui/fixed-toolbar-buttons"; // Import Buttons
import { cn } from "@/lib/utils";

// Define initial empty value structure for Plate
const initialEditorValue: Value = [{ type: "p", children: [{ text: "" }] }];

export default function AskQuestionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Create editor instance using the hook ---
  const editor = useCreateEditor({
    /* options */
  });

  const form = useForm<CreateQuestionInput>({
    resolver: zodResolver(CreateQuestionSchema),
    defaultValues: {
      title: "",
      content: initialEditorValue, // Set the default here
      tags: [],
    },
    mode: "onChange",
  });

  async function onSubmit(values: CreateQuestionInput) {
    // Use 'values' directly as Plate's onChange should have updated form state
    const submissionData = values;
    setIsSubmitting(true);
    console.log("Submitting values:", submissionData);

    try {
      const result = await createQuestion(submissionData);

      if (result.success && result.questionId) {
        toast.success("Success!", {
          description: "Your question has been posted.",
        });
        router.push(`/app/qna/${result.questionId}`);
      } else {
        // ... (error handling using toast.error)
        if (result.fieldErrors) {
          result.fieldErrors.forEach((err) => {
            form.setError(err.path[0] as keyof CreateQuestionInput, {
              type: "server",
              message: err.message,
            });
          });
          toast.error("Validation Error", {
            description: "Please check the highlighted fields.",
          });
        } else {
          toast.error("Error", {
            description: result.error || "Could not post your question.",
          });
        }
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Error", { description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Ask a Public Question</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., How to integrate Plate.js with Shadcn Form?"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Be specific and imagine you’re asking a question to another
                  person.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- Content Field using direct Plate integration --- */}
          <FormField
            control={form.control}
            name="content"
            render={(
              { field } // field provides onChange and value (for initial)
            ) => (
              <FormItem>
                <FormLabel>Detailed Explanation</FormLabel>
                <FormControl>
                  {/* --- Integrate Plate structure directly --- */}
                  <DndProvider backend={HTML5Backend}>
                    {/* Pass editor instance and hook up onChange */}
                    <Plate
                      editor={editor}
                      // No initialValue prop needed, defaultValues in useForm handles it
                      onChange={({ value }) => {
                        // Sync Plate value changes to react-hook-form
                        field.onChange(value);
                      }}
                    >
                      <EditorContainer
                        className={cn(
                          "rounded-md border border-input",
                          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                          // Add any other necessary className from original wrapper
                        )}
                      >
                        <FixedToolbar>
                          <FixedToolbarButtons />
                        </FixedToolbar>
                        <Editor
                          // Use a valid variant for your Editor component
                          variant="default" // Or "demo", or others supported
                          placeholder="Introduce the problem..."
                          className="min-h-[150px] w-full resize-none px-3 py-2 focus:outline-none"
                          focused={false}
                          // Editor consumes context from Plate for editor instance
                        />
                      </EditorContainer>
                      {/* SettingsDialog omitted - add if needed for your use case */}
                    </Plate>
                  </DndProvider>
                  {/* --- End of direct Plate integration --- */}
                </FormControl>
                <FormDescription>...</FormDescription>
                <FormMessage /> {/* Shows Zod validation errors */}
              </FormItem>
            )}
          />

          {/* Tags Field */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  {/* You need a TagInput component here */}
                  {/* This component would handle adding/removing tags */}
                  {/* and call field.onChange with the array of tag strings */}
                  <TagInput
                    value={field.value} // Current tags
                    onChange={field.onChange} // Function to update form state
                    placeholder="Add up to 5 tags (e.g., nextjs, prisma, shadcn)"
                  />
                </FormControl>
                <FormDescription>
                  Add tags to describe what your question is about. Start typing
                  to create new tags.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Post Your Question"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
