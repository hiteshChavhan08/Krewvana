"use client"

import { useState, useEffect, useCallback } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MessageSquare, Search } from "lucide-react"
import { QuestionCard } from "@/components/ama/question-card"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { fadeIn, staggerContainer } from "@/lib/animations"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"

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

interface QuestionListProps {
  sessionId: string
  isHostOrAdmin: boolean
}

export function QuestionList({ sessionId, isHostOrAdmin }: QuestionListProps) {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = useCallback(() => {
    setIsLoading(true)
    setError(null)
    const apiUrl = `/api/ama/sessions/${sessionId}/questions`
    console.log(`[QuestionList] Fetching from: ${apiUrl}`)
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load questions")
        return res.json()
      })
      .then((data: QuestionData[]) => {
        console.log("[QuestionList] Data received:", data)
        setQuestions(data)
      })
      .catch((err) => {
        console.error("Error fetching questions:", err)
        setError(err.message || "Could not fetch questions.")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [sessionId])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const handleActionComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  // Filter questions based on search query
  const filteredQuestions = questions.filter((q) => {
    // First filter by approval status
    const approvalFilter = isHostOrAdmin ? true : q.isApproved && q.answerText

    // Then filter by search query
    const searchFilter = searchQuery
      ? q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.answerText?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true

    return approvalFilter && searchFilter
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted/50 rounded-md animate-pulse mb-6"></div>
        <div className="space-y-6">
          <div className="rounded-lg border p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted/70"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/4 bg-muted/70 rounded"></div>
                <div className="h-4 w-3/4 bg-muted/70 rounded"></div>
                <div className="h-4 w-1/2 bg-muted/70 rounded"></div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted/70"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/4 bg-muted/70 rounded"></div>
                <div className="h-4 w-3/4 bg-muted/70 rounded"></div>
                <div className="h-4 w-1/2 bg-muted/70 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <AnimatedContainer variants={fadeIn}>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </AnimatedContainer>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {filteredQuestions.length === 0 ? (
        <AnimatedContainer variants={fadeIn}>
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertTitle>No Questions Found</AlertTitle>
            <AlertDescription>
              {searchQuery
                ? "No questions match your search criteria."
                : isHostOrAdmin
                  ? "No questions have been submitted for this session yet."
                  : "No answered questions available for this session yet. Check back later!"}
            </AlertDescription>
          </Alert>
        </AnimatedContainer>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          {filteredQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              isHostOrAdmin={isHostOrAdmin}
              onActionComplete={handleActionComplete}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
