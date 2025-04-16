"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Trophy, Medal, User, Users } from "lucide-react"

interface LeaderboardEntry {
  id: string
  name: string
  points: number
  rank: number
  avatar?: string
  department?: string
}

interface TeamLeaderboardEntry {
  id: string
  name: string
  points: number
  rank: number
  memberCount: number
}

export default function Leaderboards() {
  const [leaderboardType, setLeaderboardType] = useState<"individual" | "team">("individual")
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "allTime">("weekly")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [individualLeaderboard, setIndividualLeaderboard] = useState<LeaderboardEntry[]>([])
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([])

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/leaderboards?type=${leaderboardType}&timeframe=${timeframe}`)
        if (!response.ok) throw new Error("Failed to fetch leaderboard data")
        const data = await response.json()

        if (leaderboardType === "individual") {
          setIndividualLeaderboard(data)
        } else {
          setTeamLeaderboard(data)
        }
      } catch (err) {
        setError("Failed to load leaderboard data. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboards()
  }, [leaderboardType, timeframe])

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Leaderboards</h2>
          <p className="text-muted-foreground">See who's leading in wellness activities</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <Select value={leaderboardType} onValueChange={(value) => setLeaderboardType(value as "individual" | "team")}>
            <SelectTrigger>
              <SelectValue placeholder="Leaderboard Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-1/2">
          <Select value={timeframe} onValueChange={(value) => setTimeframe(value as "weekly" | "monthly" | "allTime")}>
            <SelectTrigger>
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {leaderboardType === "individual" ? "Individual" : "Team"} Leaderboard -
            {timeframe === "weekly" ? " This Week" : timeframe === "monthly" ? " This Month" : " All Time"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboardType === "individual" ? (
            individualLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No data available for this timeframe.</p>
            ) : (
              <div className="space-y-4">
                {individualLeaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.rank <= 3 ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getMedalIcon(entry.rank) || <span className="font-medium">{entry.rank}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {entry.avatar ? (
                            <img
                              src={entry.avatar || "/placeholder.svg"}
                              alt={entry.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{entry.name}</p>
                          {entry.department && <p className="text-xs text-muted-foreground">{entry.department}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">{entry.points} pts</div>
                  </div>
                ))}
              </div>
            )
          ) : teamLeaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No data available for this timeframe.</p>
          ) : (
            <div className="space-y-4">
              {teamLeaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.rank <= 3 ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getMedalIcon(entry.rank) || <span className="font-medium">{entry.rank}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.memberCount} members</p>
                      </div>
                    </div>
                  </div>
                  <div className="font-bold">{entry.points} pts</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
