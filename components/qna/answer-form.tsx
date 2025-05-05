// components/qna/answer-form.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Value } from "@udecode/plate"; // <-- Restored original Plate type import path assumption
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plate } from "@udecode/plate/react"; // <-- Restored original Plate component import path assumption
// import { resetEditor } from "@udecode/plate/react"; // Keep reset utility if using it

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CreateAnswerSchema, CreateAnswerInput } from "@/lib/validations/qna"; // Adjust path if needed
// Import mutation hook and query client
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreateEditor } from "@/components/editor/use-create-editor"; // Keep user's import path
import { Editor, EditorContainer } from "@/components/plate-ui/editor"; // Keep user's import path
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react"; // Keep Loader icon
import { ZodError } from "zod"; // Keep ZodError for type checking

// --- API Call Function ---
// Define this outside or import it
async function postAnswerApi(payload: { questionId: string; content: Value }): Promise<any> { // Define specific success type if known
    const { questionId, content } = payload;
    const apiUrl = `/api/questions/${questionId}/answers`; // Ensure this is correct
    console.log(`[AnswerForm] Posting to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }), // Send only content as per schema likely
    });

    if (!response.ok) {
        let errorMsg = 'Failed to post answer.';
        try {
            const errorData = await response.json();
            const validationError = errorData.details?.[0]?.message || errorData.errors?.[Object.keys(errorData.errors)[0]]?.[0];
            errorMsg = validationError || errorData.error || errorData.message || `Request failed (${response.status})`;
        } catch (e) { errorMsg = `Request failed (${response.status})`; }
        console.error(`[AnswerForm] API Error (${response.status}): ${errorMsg}`);
        throw new Error(errorMsg);
    }
    console.log("[AnswerForm] API Success");
    return response.json();
}


// --- Component Props ---
interface AnswerFormProps {
  questionId: string;
  // Use the prop name expected by the parent page
  onAnswerAdded: () => void;
}

const initialEditorValue: Value = [{ type: "p", children: [{ text: "" }] }];

export function AnswerForm({ questionId, onAnswerAdded }: AnswerFormProps) {
  // Remove isSubmitting state, use mutation.isPending instead
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const editor = useCreateEditor({
    // initialValue: initialEditorValue, // Pass initial value here if hook supports it
    /* other editor options */
  });

  const form = useForm<CreateAnswerInput>({
    resolver: zodResolver(CreateAnswerSchema),
    defaultValues: {
      // questionId is likely not part of this schema, it's passed separately
      content: initialEditorValue,
    },
    mode: "onChange",
  });

  // --- FIX: Use Mutation Hook ---
  const mutation = useMutation({
      mutationFn: (formData: CreateAnswerInput) => postAnswerApi({ questionId, content: formData.content }),
      onSuccess: (data) => { // data is the response from postAnswerApi
            toast.success("Success!", { description: "Your answer has been posted." });
            form.reset(); // Reset RHF state
            // resetEditor(editor); // Reset Plate editor state
            onAnswerAdded?.(); // Call parent callback
      },
      onError: (error: Error) => { // <-- FIX: Added explicit Error type
           toast.error("Error Posting Answer", { description: error.message || "Could not save your answer." });
           console.error("Submit Answer Mutation Error:", error);
      },
  });


  // --- FIX: Modify onSubmit to use mutation ---
  async function onSubmit(values: CreateAnswerInput) {
    // No need for manual setIsSubmitting or try/catch here for the API call
    // Zod validation is handled by form.handleSubmit automatically
    // The API call logic is now within mutationFn
    console.log("Submitting answer via mutation:", values);
    mutation.mutate(values); // Trigger the mutation
  }


  return (
    <Form {...form}>
      {/* Use RHF's handleSubmit */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Your Answer</FormLabel>
              <FormControl>
                {/* Keep user's Plate integration structure */}
                <DndProvider backend={HTML5Backend}>
                  <Plate
                    editor={editor}
                    onChange={({ value }) => {
                      field.onChange(value);
                    }} // Update RHF field state on change
                  >
                    <EditorContainer
                      className={cn(
                        "rounded-md border border-input",
                        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                      )}
                    >
                      {/* Add Toolbars as needed */}
                      <Editor
                        // {...field} // Avoid spreading if value/onChange handled above
                        ref={field.ref} // Pass RHF ref
                        name={field.name} // Pass RHF name
                        onBlur={field.onBlur} // Pass RHF onBlur
                        variant="default"
                        placeholder="Provide a detailed answer..."
                        className="min-h-[150px] w-full resize-none px-3 py-2 focus:outline-none"
                        // focused={false} // Remove if Plate manages focus
                        // readOnly={mutation.isPending} // Optionally disable editor while submitting
                      />
                    </EditorContainer>
                  </Plate>
                </DndProvider>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
           {/* Use mutation.isPending for loading state */}
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Post Your Answer
        </Button>
      </form>
    </Form>
  );
}