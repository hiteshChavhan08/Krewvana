// components/qna/answer-form.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Value } from "@udecode/plate";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plate } from "@udecode/plate/react"; // <-- Changed import // Import reset utility

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CreateAnswerSchema, CreateAnswerInput } from "@/lib/validations/qna";
import { createAnswer } from "@/lib/actions/qna";
import { useCreateEditor } from "@/components/editor/use-create-editor";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { cn } from "@/lib/utils";

interface AnswerFormProps {
  questionId: string;
  onAnswerSubmit?: () => void;
}

const initialEditorValue: Value = [{ type: "p", children: [{ text: "" }] }];

export function AnswerForm({ questionId, onAnswerSubmit }: AnswerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useCreateEditor({
    /* options */
  });

  const form = useForm<CreateAnswerInput>({
    resolver: zodResolver(CreateAnswerSchema),
    defaultValues: {
      questionId: questionId,
      content: initialEditorValue,
    },
    mode: "onChange",
  });

  async function onSubmit(values: CreateAnswerInput) {
    const submissionData = values;
    setIsSubmitting(true);
    console.log("Submitting answer:", submissionData);
  
    try {
      const result = await createAnswer(submissionData);
  
      if (result.success && result.answerId) {
        toast.success("Success!", {
          description: "Your answer has been posted.",
        });
        form.reset();
  
        const editorRange = editor.selection;
  
        if (
          editorRange &&
          (editorRange.anchor.offset !== 0 ||
            editorRange.focus.offset !== 0 ||
            editor.children.length > 1 ||
            (editor.children[0] as any)?.children?.[0]?.text !== "")
        ) {
          editor.tf.delete({ at: editorRange });
        }
  
        editor.tf.select(editor.api.start(editor));
        editor.tf.collapse({ edge: "start" });
  
        onAnswerSubmit?.();
      } else {
        if (result.fieldErrors) {
          result.fieldErrors.forEach((err) => {
            form.setError(err.path[0] as keyof CreateAnswerInput, {
              type: "server",
              message: err.message,
            });
          });
          toast.error("Validation Error", {
            description: "Please check your input.",
          });
        } else {
          toast.error("Error", {
            description: result.error || "Could not post your answer.",
          });
        }
      }
    } catch (error) {
      console.error("Submit Answer Error:", error);
      toast.error("Error", { description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  }
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        {/* --- Content Field using direct Plate integration --- */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Answer</FormLabel>
              <FormControl>
                {/* --- Integrate Plate structure directly --- */}
                <DndProvider backend={HTML5Backend}>
                  <Plate
                    editor={editor}
                    onChange={({ value }) => {
                      field.onChange(value);
                    }}
                  >
                    <EditorContainer
                      className={cn(
                        "rounded-md border border-input",
                        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                      )}
                    >
                      {/* <FixedToolbar>
                        <FixedToolbarButtons />
                      </FixedToolbar> */}
                      <Editor
                        variant="default" // Or another valid variant
                        placeholder="Provide a detailed answer..."
                        className="min-h-[150px] w-full resize-none px-3 py-2 focus:outline-none"
                        focused={false}
                      />
                    </EditorContainer>
                  </Plate>
                </DndProvider>
                {/* --- End of direct Plate integration --- */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Post Your Answer"}
        </Button>
      </form>
    </Form>
  );
}
