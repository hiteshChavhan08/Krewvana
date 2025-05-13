// components\qna\answer-form.tsx
"use client";

import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// --- Plate Imports ---
import { Plate } from "@udecode/plate/react";
import { useCreateEditor } from "@/components/editor/use-create-editor";
import { Editor } from "@/components/plate-ui/editor";
import type { Value } from "@udecode/plate";
// --- ADD THIS: Import the DnD Provider ---
import { DndProvider } from "react-dnd"; // Adjust import path if necessary
import { HTML5Backend } from "react-dnd-html5-backend";
// --- UI components ---
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Added Card parts

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

  const editor = useCreateEditor({
    id: `answer-editor-${questionId}`,
    value: editorValue,
    // onChange: (newValue) => {
    //     setEditorValue(newValue);
    // },
    // Ensure you are NOT including dnd plugins here if you don't intend to use block dragging
    // plugins: [...]
  });

  const isEditorEmpty = (value: Value): boolean => {
    // Simple check for empty state
    return (
      !value ||
      value.length === 0 ||
      (value.length === 1 &&
        value[0].type === "p" &&
        value[0].children?.length === 1 &&
        value[0].children[0].text === "")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditorEmpty(editorValue)) {
      toast.error("Please enter your answer before submitting.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your answer...");
    try {
      const response = await fetch(`/api/qna/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editorValue }),
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to submit answer. Server error." }));
        throw new Error(errorData.message || "Failed to submit answer");
      }
      toast.success("Answer submitted successfully!", { id: toastId });
      setEditorValue(initialValue); // Reset state value
      // Consider editor.reset() if available and needed
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
    // Changed from div to Card for better visual separation
    <Card className="mt-6 mb-8 border shadow-sm" id="answer-form-card">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight">
          Your Answer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {/* --- Wrap Plate with DndProvider --- */}
          <DndProvider backend={HTML5Backend}>
            <div className="overflow-hidden rounded-md border border-input shadow-sm">
              {" "}
              {/* Add border/styling */}
              <Plate editor={editor}>
                <Editor
                  placeholder="Write your detailed answer here..."
                  variant="ai"
                  className="min-h-[180px] bg-background p-4 text-sm" // Slightly reduced min-height
                />
              </Plate>
            </div>
          </DndProvider>

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
      </CardContent>
    </Card>
  );
};
