// components/qna/answer-form.tsx
"use client";

import React, { useEffect } from "react"; // Added useEffect
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Value } from "@udecode/plate";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plate } from "@udecode/plate/react";
// import { resetEditor } from "@udecode/plate/react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// 👇 Import the refined schema
import { CreateAnswerSchema, CreateAnswerInput } from "@/lib/validations/qna";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreateEditor } from "@/components/editor/use-create-editor";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { postAnswerApi } from "@/lib/api/qnaApi";

interface AnswerFormProps {
  questionId: string;
  onAnswerAdded: () => void;
}

const initialEditorValue: Value = [{ type: "p", children: [{ text: "" }] }];

export function AnswerForm({ questionId, onAnswerAdded }: AnswerFormProps) {
  const queryClient = useQueryClient();

  const editor = useCreateEditor({ value: initialEditorValue });

  const form = useForm<CreateAnswerInput>({
    resolver: zodResolver(CreateAnswerSchema), // Uses the potentially updated schema
    defaultValues: { content: initialEditorValue },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (formData: CreateAnswerInput) =>
      postAnswerApi({ questionId, content: formData.content }),
    onSuccess: (data) => {
      toast.success("Success!", {
        description: "Your answer has been posted.",
      });
      form.reset();
      // resetEditor(editor);
      editor.tf.reset();
      onAnswerAdded?.();
    },
    onError: (error: Error) => {
      toast.error("Error Posting Answer", {
        description: error.message || "Could not save your answer.",
      });
      console.error("Submit Answer Mutation Error:", error);
    },
  });

  // Form submission triggers the mutation *after* RHF validation
  function onSubmit(values: CreateAnswerInput) {
    console.log("Validation Passed. Submitting via mutation:", values); // Check if this logs
    mutation.mutate(values);
  }

  // --- Debug: Log validation errors ---
  //   useEffect(() => {
  //     if (Object.keys(form.formState.errors).length > 0) {
  //         console.log("RHF Validation Errors:", form.formState.errors);
  //     }
  //   }, [form.formState.errors]);
  // --- End Debug ---

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Your Answer</FormLabel>
              <FormControl>
                <DndProvider backend={HTML5Backend}>
                  <Plate
                    editor={editor}
                    // value={field.value} // Controlled by RHF
                    onChange={(
                      // 👇 Check Plate docs for exact argument type, could be editor or options object
                      // Assuming editor instance is passed or available on options
                      newEditorState // Or options: { editor: TPlateEditor<Value> }
                    ) => {
                      // Get the current value from the editor instance
                      // Use editor.children for newer versions, or editor.value if applicable
                      const currentValue = editor.children as Value; // Or editor.value
                      console.log("Plate onChange - new value:", currentValue); // Debug log
                      field.onChange(currentValue); // Update RHF with the value from the editor state
                    }}
                  >
                    <EditorContainer className={cn(/* styles */)}>
                      <Editor
                        ref={field.ref}
                        name={field.name}
                        onBlur={field.onBlur}
                        placeholder="Provide a detailed answer..."
                        className="min-h-[150px] w-full resize-none px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md border border-input"
                        // readOnly={mutation.isPending} // Optional
                      />
                    </EditorContainer>
                  </Plate>
                </DndProvider>
              </FormControl>
              {/* Ensure FormMessage is rendered to see Zod errors */}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Post Your Answer
        </Button>
      </form>
    </Form>
  );
}
