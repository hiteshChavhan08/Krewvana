// components\ama\question-card.tsx
"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { getInitials } from "@/lib/utils/helpers"
import { formatDistanceToNow } from "@/lib/utils/date-helpers"
import { Check, Trash2, Loader2, MessageSquare, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { scaleIn } from "@/lib/animations"

type QuestionData = {
  id: string
  text: string
  isAnonymous: boolean
  isApproved: boolean
  answerText: string | null
  answeredAt: string | Date | null
  createdAt: string | Date
  submittedBy: { id: string; name: string | null; image: string | null } | null
  answeredBy: { id: string; name: string | null; image: string | null } | null
}

interface QuestionCardProps {
  question: QuestionData
  isHostOrAdmin: boolean
  onActionComplete: () => void
}

export function QuestionCard({ question: initialQuestion, isHostOrAdmin, onActionComplete }: QuestionCardProps) {
  const [isAnswering, setIsAnswering] = useState(false)
  const [question, setQuestion] = useState(initialQuestion)
  const [answerValue, setAnswerValue] = useState(question.answerText ?? "")
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [isLoadingAction, setIsLoadingAction] = useState<false | "approve" | "delete">(false)
  const [likes, setLikes] = useState(Math.floor(Math.random() * 5)) // Just for UI demo

  // --- API Call Helper for Question Actions ---
  const handleQuestionAction = async (
    action: () => Promise<Response>,
    loadingMessage: string,
    successMessage: string,
    errorMessagePrefix: string,
    actionType: "approve" | "delete" | "answer",
  ) => {
    if (actionType === "answer") setIsSubmittingAnswer(true)
    else setIsLoadingAction(actionType)

    const toastId = toast.loading(loadingMessage)
    try {
      const response = await action()

      if (!response.ok) {
        let errorMsg = `Error ${response.status}`
        try {
          const errorData = await response.json()
          errorMsg = errorData.message || errorMsg
        } catch (jsonError) {
          errorMsg = (await response.text()) || response.statusText || errorMsg
        }
        throw new Error(errorMsg)
      }

      const responseData = response.status !== 204 ? await response.json() : null
      toast.success(successMessage, { id: toastId })

      if (responseData && actionType !== "delete") {
        const processedData = {
          ...responseData,
          submittedBy: responseData.isAnonymous ? null : responseData.submittedBy,
          submittedById: responseData.isAnonymous ? null : responseData.submittedById,
        }
        setQuestion(processedData as QuestionData)
        setAnswerValue(processedData.answerText ?? "")
        setIsAnswering(false)
      }
      onActionComplete()
    } catch (error: any) {
      console.error(`${errorMessagePrefix} error:`, error)
      toast.error(`${errorMessagePrefix}: ${error.message}`, { id: toastId })
    } finally {
      if (actionType === "answer") setIsSubmittingAnswer(false)
      else setIsLoadingAction(false)
    }
  }

  const handleApprove = () =>
    handleQuestionAction(
      () =>
        fetch(`/api/ama/questions/${question.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isApproved: true }),
        }),
      "Approving question...",
      "Question approved!",
      "Approval failed",
      "approve",
    )

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this question? This cannot be undone.")) return
    handleQuestionAction(
      () => fetch(`/api/ama/questions/${question.id}`, { method: "DELETE" }),
      "Deleting question...",
      "Question deleted.",
      "Delete failed",
      "delete",
    )
  }

  const handleAnswerSubmit = () =>
    handleQuestionAction(
      () =>
        fetch(`/api/ama/questions/${question.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answerText: answerValue.trim() }),
        }),
      "Submitting answer...",
      "Answer submitted!",
      "Answer submission failed",
      "answer",
    )

  if (!question) return null

  return (
    <motion.div initial="hidden" animate="visible" variants={scaleIn} layout className="group">
      <Card
        className={`transition-all duration-300 overflow-hidden ${
          !question.isApproved && !isHostOrAdmin ? "hidden" : ""
        } ${
          !question.isApproved && isHostOrAdmin
            ? "border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10"
            : "hover:shadow-md"
        }`}
      >
        <CardContent className="p-0">
          {/* Question Header */}
          <div className="p-4 pb-3 bg-muted/30">
            <div className="flex gap-3">
              <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-background">
                <AvatarImage src={question.submittedBy?.image ?? undefined} />
                <AvatarFallback>{getInitials(question.submittedBy?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{question.submittedBy?.name ?? "Anonymous User"}</p>
                  {question.isAnonymous && (
                    <Badge variant="outline" className="text-xs h-5">
                      Anonymous
                    </Badge>
                  )}
                  {!question.isApproved && isHostOrAdmin && (
                    <Badge
                      variant="secondary"
                      className="text-xs h-5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    >
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(question.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="p-4 pt-3 pb-3">
            <div className="flex gap-2">
              <div className="w-9 flex-shrink-0"></div> {/* Spacer to align with avatar */}
              <div className="flex-grow">
                <p className="text-sm text-foreground leading-relaxed">{question.text}</p>

                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <button
                    onClick={() => setLikes((prev) => prev + 1)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{likes}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Answer Section */}
          {question.isApproved && question.answerText && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="border-t"
            >
              <div className="p-4 bg-primary/5">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary/10">
                    <AvatarImage src={question.answeredBy?.image ?? undefined} />
                    <AvatarFallback>{getInitials(question.answeredBy?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {question.answeredBy?.name ?? "Host"}{" "}
                        <Badge variant="outline" className="text-xs ml-1">
                          Host
                        </Badge>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(question.answeredAt!, { addSuffix: true })}
                    </p>
                    <p className="text-sm text-foreground/90 mt-2 leading-relaxed">{question.answerText}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Answer Form */}
          {isHostOrAdmin && question.isApproved && !question.answerText && (
            <div className="border-t p-4">
              <AnimatePresence>
                {!isAnswering ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAnswering(true)}
                      className="w-full justify-center"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Answer this question
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <Textarea
                      placeholder="Type your answer here..."
                      value={answerValue}
                      onChange={(e) => setAnswerValue(e.target.value)}
                      rows={3}
                      className="focus-visible:ring-primary"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAnswering(false)
                          setAnswerValue("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAnswerSubmit}
                        disabled={!answerValue.trim() || isSubmittingAnswer}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isSubmittingAnswer && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                        Submit Answer
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>

        {/* Host/Admin Actions Footer */}
        {isHostOrAdmin && (
          <CardFooter className="py-2 px-4 border-t bg-muted/30 flex justify-end gap-2">
            {!question.isApproved && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleApprove}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Check className="h-4 w-4 mr-1.5" /> Approve
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
