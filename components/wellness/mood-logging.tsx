"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, SmilePlus } from "lucide-react"
import { toast } from "sonner"

type MoodLevel = 1 | 2 | 3 | 4 | 5

interface MoodOption {
  level: MoodLevel
  label: string
  emoji: string
}

const moodOptions: MoodOption[] = [
  { level: 1, label: "Very Low", emoji: "😞" },
  { level: 2, label: "Low", emoji: "😔" },
  { level: 3, label: "Neutral", emoji: "😐" },
  { level: 4, label: "Good", emoji: "🙂" },
  { level: 5, label: "Excellent", emoji: "😄" },
]

export default function MoodLogging() {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [loading, setLoading] = useState(false)

  const handleMoodSelection = async (level: MoodLevel) => {
    setSelectedMood(level)
    setLoading(true)

    try {
      const response = await fetch("/api/wellness/mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moodLevel: level, date: new Date().toISOString() }),
      })

      if (!response.ok) throw new Error("Failed to log mood")

      toast.message(
        "Mood Logged",{
        description: "Your mood has been successfully recorded.",
      })
    } catch (err) {
      console.error(err)
      toast.error(
        "Failed to log your mood. Please try again.",
      )
    } finally {
      setLoading(false)
      // Reset selection after a delay
      setTimeout(() => setSelectedMood(null), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <SmilePlus className="h-5 w-5 text-primary" />
          Log Your Mood
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">How are you feeling today?</p>

          <div className="flex justify-between">
            {moodOptions.map((mood) => (
              <Button
                key={mood.level}
                variant="ghost"
                className={`flex flex-col items-center p-2 h-auto ${selectedMood === mood.level ? "bg-primary/10" : ""}`}
                disabled={loading}
                onClick={() => handleMoodSelection(mood.level)}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-xs mt-1">{mood.label}</span>
              </Button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
