"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Trophy, Users, User } from "lucide-react"

interface ProgressData {
  challengeTitle: string
  challengeGoal: number
  userProgress: number
  teamProgress?: number
  topContributors?: {
    name: string
    progress: number
  }[]
}

interface ChallengeProgressProps {
  challengeId: string
}

export default function ChallengeProgress({ challengeId }: ChallengeProgressProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/wellness/challenges/${challengeId}/progress`)
        if (!response.ok) throw new Error("Failed to fetch progress data")
        const data = await response.json()
        setProgressData(data)
      } catch (err) {
        setError("Failed to load progress data. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (challengeId) {
      fetchProgress()
    }
  }, [challengeId])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error || !progressData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">{error || "No progress data available"}</p>
        </CardContent>
      </Card>
    )
  }

  const userProgressPercentage = Math.min(
    Math.round((progressData.userProgress / progressData.challengeGoal) * 100),
    100,
  )

  const teamProgressPercentage = progressData.teamProgress
    ? Math.min(Math.round((progressData.teamProgress / progressData.challengeGoal) * 100), 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {progressData.challengeTitle} Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="personal">Personal Progress</TabsTrigger>
            {progressData.teamProgress !== undefined && <TabsTrigger value="team">Team Progress</TabsTrigger>}
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Your Progress</span>
                <span className="font-medium">{userProgressPercentage}%</span>
              </div>
              <Progress value={userProgressPercentage} className="h-2" />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                You've completed {progressData.userProgress} out of {progressData.challengeGoal} units
              </p>
            </div>
          </TabsContent>

          {progressData.teamProgress !== undefined && (
            <TabsContent value="team" className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Team Progress</span>
                  <span className="font-medium">{teamProgressPercentage}%</span>
                </div>
                <Progress value={teamProgressPercentage} className="h-2" />
              </div>

              {progressData.topContributors && progressData.topContributors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" /> Top Contributors
                  </h4>
                  <div className="space-y-2">
                    {progressData.topContributors.map((contributor, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{contributor.name}</span>
                        </div>
                        <span className="text-sm font-medium">{contributor.progress} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
