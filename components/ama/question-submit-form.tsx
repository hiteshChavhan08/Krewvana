"use client"

import { useState } from "react"
import { useForm, type SubmitHandler, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { slideUp } from "@/lib/animations"
import { motion } from "framer-motion"

const submitQuestionSchema = z.object({
  text: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(1000, "Question cannot exceed 1000 characters"),
  isAnonymous: z.boolean().optional().default(false),
})

type QuestionFormInput = z.input<typeof submitQuestionSchema>

interface QuestionSubmitFormProps {
  sessionId: string
}

export function QuestionSubmitForm({ sessionId }: QuestionSubmitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<QuestionFormInput>({
    resolver: zodResolver(submitQuestionSchema),
    defaultValues: {
      text: "",
      isAnonymous: false,
    },
  })

  const onSubmit: SubmitHandler<QuestionFormInput> = async (data) => {
    setIsSubmitting(true)
    const toastId = toast.loading("Submitting question...")

    try {
      const response = await fetch(`/api/ama/sessions/${sessionId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`)
      }

      toast.success("Question submitted successfully!", {
        description: "It will appear once approved by the host.",
        id: toastId,
      })
      reset()
      router.refresh()
    } catch (error: any) {
      console.error("Failed to submit question:", error)
      toast.error(`Submission failed: ${error.message || "Please try again."}`, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatedContainer variants={slideUp}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <motion.div whileTap={{ scale: 0.995 }} whileFocus={{ scale: 1.005 }}>
          <Label htmlFor="questionText" className="sr-only">
            Your Question
          </Label>
          <Textarea
            id="questionText"
            placeholder="Type your question here..."
            rows={4}
            {...register("text")}
            className={errors.text ? "border-red-500 focus-visible:ring-red-500" : ""}
            aria-invalid={errors.text ? "true" : "false"}
          />
          {errors.text && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 mt-1"
            >
              {errors.text.message}
            </motion.p>
          )}
        </motion.div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Controller
              name="isAnonymous"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="isAnonymous"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
            <Label htmlFor="isAnonymous" className="text-sm font-normal text-muted-foreground">
              Submit anonymously
            </Label>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Question
            </Button>
          </motion.div>
        </div>
      </form>
    </AnimatedContainer>
  )
}
