"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Coins } from "lucide-react";
import { toast } from "sonner";

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: string;
  available: boolean;
  imageUrl: string;
}

export default function RewardsCatalog() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rewards catalog
        const rewardsResponse = await fetch("/api/rewards/catalog");
        if (!rewardsResponse.ok) throw new Error("Failed to fetch rewards");
        const rewardsData = await rewardsResponse.json();
        setRewards(rewardsData);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(rewardsData.map((r: Reward) => r.category))
        );
        setCategories(uniqueCategories as string[]);

        // Fetch user points
        const userResponse = await fetch("/api/users/me");
        if (!userResponse.ok) throw new Error("Failed to fetch user data");
        const userData = await userResponse.json();
        setUserPoints(userData.points || 0);
      } catch (err) {
        setError("Failed to load rewards. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward);
    setConfirmDialogOpen(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;

    setRedeeming(true);
    try {
      const response = await fetch("/api/rewards/redemptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rewardId: selectedReward.id }),
      });

      if (!response.ok) throw new Error("Failed to redeem reward");

      // Update user points
      setUserPoints((prev) => prev - selectedReward.pointsCost);

      toast.message("Reward Redeemed", {
        description: `You've successfully redeemed ${selectedReward.title}!`,
      });

      setConfirmDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to redeem reward. Please try again.");
    } finally {
      setRedeeming(false);
    }
  };

  const filteredRewards = selectedCategory
    ? rewards.filter((reward) => reward.category === selectedCategory)
    : rewards;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Rewards Catalog</h2>
          <p className="text-muted-foreground">
            Redeem your points for exciting rewards
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
          <Coins className="h-5 w-5 text-primary" />
          <span className="font-bold">{userPoints} points available</span>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {filteredRewards.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No rewards available in this category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRewards.map((reward) => (
            <Card key={reward.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{reward.title}</CardTitle>
                  <Badge variant="outline">{reward.category}</Badge>
                </div>
                <CardDescription>{reward.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="aspect-video bg-muted rounded-md overflow-hidden mb-4">
                  <img
                    src={
                      reward.imageUrl || "/placeholder.svg?height=200&width=400"
                    }
                    alt={reward.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Coins className="h-4 w-4 text-primary" />
                  <span>{reward.pointsCost} points</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleRedeemClick(reward)}
                  disabled={!reward.available || userPoints < reward.pointsCost}
                >
                  {!reward.available
                    ? "Out of Stock"
                    : userPoints < reward.pointsCost
                    ? "Not Enough Points"
                    : "Redeem Reward"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="py-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{selectedReward.title}</h4>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-primary" />
                  <span>{selectedReward.pointsCost} points</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedReward.description}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={redeeming}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmRedeem} disabled={redeeming}>
              {redeeming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redeeming...
                </>
              ) : (
                "Confirm Redemption"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
