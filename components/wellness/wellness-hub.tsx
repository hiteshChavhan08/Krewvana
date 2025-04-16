"use client"

import { useState } from "react"
import WellnessChallengesList from "./wellness-challenges-list"
import ChallengeProgress from "./challenge-progress"
import ActivityLogging from "./activity-logging"
import MoodLogging from "./mood-logging"

export default function WellnessHub() {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3">
          <WellnessChallengesList onSelectChallenge={(id) => setSelectedChallengeId(id)} />
        </div>
        <div className="w-full md:w-1/3 space-y-6">
          <ActivityLogging />
          <MoodLogging />
        </div>
      </div>

      {selectedChallengeId && <ChallengeProgress challengeId={selectedChallengeId} />}
    </div>
  )
}
