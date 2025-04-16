"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RewardsCatalog from "./rewards-catalog"
import Leaderboards from "./leaderboards"

export default function RewardsAndLeaderboards() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rewards">Rewards Catalog</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
        </TabsList>
        <TabsContent value="rewards">
          <RewardsCatalog />
        </TabsContent>
        <TabsContent value="leaderboards">
          <Leaderboards />
        </TabsContent>
      </Tabs>
    </div>
  )
}
