// app/app/ama/[sessionId]/_components/question-submit-form.tsx
"use client";

import { useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // To refresh question list potentially
import { Loader2 } from "lucide-react";

// Schema matching API expectation
const submitQuestionSchema = z.object({
  text: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(1000, "Question cannot exceed 1000 characters"),
  // Let's use optional + default again, as preprocess didn't resolve it
  isAnonymous: z.boolean().optional().default(false),
});

type QuestionFormInput = z.input<typeof submitQuestionSchema>; // Might be { text: string; isAnonymous?: boolean | undefined }
type QuestionFormOutput = z.output<typeof submitQuestionSchema>;

interface QuestionSubmitFormProps {
  sessionId: string;
}

export function QuestionSubmitForm({ sessionId }: QuestionSubmitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter(); // Use router to potentially refresh parts of the page

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<QuestionFormInput>({
    resolver: zodResolver(submitQuestionSchema), // <<< Pass the schema itself
    defaultValues: {
      // <<< defaultValues MUST match QuestionFormOutput
      text: "",
      isAnonymous: false, // Matches the output type where default is applied
    },
  });

  const onSubmit: SubmitHandler<QuestionFormInput> = async (data) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting question...");

    try {
      const response = await fetch(`/api/ama/sessions/${sessionId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json(); // Attempt to parse response

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }

      toast.success("Question submitted successfully!", {
        description: "It will appear once approved by the host.",
        id: toastId,
      });
      reset(); // Clear the form
      router.refresh(); // Re-fetch server components / potentially trigger QuestionList re-fetch if using SWR key dependency
    } catch (error: any) {
      console.error("Failed to submit question:", error);
      toast.error(
        `Submission failed: ${error.message || "Please try again."}`,
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="questionText" className="sr-only">
          Your Question
        </Label>
        <Textarea
          id="questionText"
          placeholder="Type your question here..."
          rows={4}
          {...register("text")}
          className={
            errors.text ? "border-red-500 focus-visible:ring-red-500" : ""
          }
          aria-invalid={errors.text ? "true" : "false"}
        />
        {errors.text && (
          <p className="text-sm text-red-600 mt-1">{errors.text.message}</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
        <Controller
        name="isAnonymous"
        control={control} // Make sure to get 'control' from useForm()
        render={({ field }) => (
            <Checkbox
                id="isAnonymous"
                checked={field.value} // Use checked prop
                onCheckedChange={field.onChange} // Use onCheckedChange
                onBlur={field.onBlur}
                ref={field.ref}
            />
        )}
    />
          <Label
            htmlFor="isAnonymous"
            className="text-sm font-normal text-muted-foreground"
          >
            Submit anonymously
          </Label>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Submit Question
        </Button>
      </div>
    </form>
  );
}
