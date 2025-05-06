// components\qna\answer-form.tsx
"use client";

import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Plate imports
import { Plate } from "@udecode/plate/react";
import { useCreateEditor } from "@/components/editor/use-create-editor";
import { Editor } from "@/components/plate-ui/editor";
import type { Value } from "@udecode/plate";

// UI components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AnswerFormProps {
  questionId: string;
  onAnswerAdded: () => void; // Callback to potentially refetch data
}

const initialValue: Value = [{ type: "p", children: [{ text: "" }] }];

export const AnswerForm: React.FC<AnswerFormProps> = ({
  questionId,
  onAnswerAdded,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorValue, setEditorValue] = useState<Value>(initialValue);

  // Create editor instance - ensure it updates state correctly
  const editor = useCreateEditor({
    id: `answer-editor-${questionId}`, // Unique ID per question instance
    value: editorValue,
    // onChange: (newValue) => {
    //   setEditorValue(newValue); // Keep track of the editor's value
    // },
  });

  // Simple check if editor is effectively empty
  const isEditorEmpty = (value: Value): boolean => {
    if (!value || value.length === 0) return true;
    if (value.length === 1) {
      const node = value[0];
      if (
        node.type === "p" &&
        node.children?.length === 1 &&
        node.children[0].text === ""
      ) {
        return true;
      }
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate content
    if (isEditorEmpty(editorValue)) {
      toast.error("Please enter your answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your answer...");

    try {
      const response = await fetch(`/api/qna/questions/${questionId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editorValue }), // Send the editor's value
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to submit answer. Server error." }));
        throw new Error(errorData.message || "Failed to submit answer");
      }

      toast.success("Answer submitted successfully!", { id: toastId });

      // Reset form and notify parent
      setEditorValue(initialValue); // Reset state value
      // editor.reset(); // Optional: If plate editor has a reset method
      onAnswerAdded(); // Trigger refetch or update
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      toast.error(
        error.message || "Failed to submit your answer. Please try again.",
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t">
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-4">
        Your Answer
      </h2>
      <form onSubmit={handleSubmit} id="answer-form">
        {/* Wrap Plate editor in Card for styling consistency */}
        <Card className="overflow-hidden border shadow-sm">
          <Plate editor={editor}>
            <Editor
              placeholder="Write your detailed answer here..."
              variant="ai" // Or your preferred variant
              className="min-h-[200px] bg-background p-4" // Ensure padding inside editor
              // Note: Plate's Editor might not directly accept onChange,
              // it's handled by useCreateEditor hook's options
            />
          </Plate>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || isEditorEmpty(editorValue)}
            className="px-6 min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Post Your Answer"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
