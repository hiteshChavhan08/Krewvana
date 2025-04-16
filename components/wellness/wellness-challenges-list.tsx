// components/wellness/wellness-challenges-list.tsx
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
import { Loader2, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: "individual" | "team";
  participants: number;
  joined: boolean;
}

interface WellnessChallengesListProps {
  onSelectChallenge: (id: string) => void;
}

export default function WellnessChallengesList({
  onSelectChallenge,
}: WellnessChallengesListProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch("/api/wellness/challenges");
        if (!response.ok) throw new Error("Failed to fetch challenges");
        const result = await response.json();
        setChallenges(result.data); // Extract the 'data' array
      } catch (err) {
        setError("Failed to load challenges. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  // components/wellness/wellness-challenges-list.tsx

  // components/wellness/wellness-challenges-list.tsx

  const handleJoinChallenge = async (challengeId: string) => {
    console.log("Attempting to join challenge with ID:", challengeId);
    setJoiningId(challengeId);
    // Remove previous error message if desired
    // setError(null);

    try {
      const response = await fetch(
        `/api/wellness/challenges/${challengeId}/join`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        let errorMessage = "Failed to join challenge";
        let errorData = { message: "" }; // Default error data structure
        try {
          errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          } else {
            // Use status code for fallback
            if (response.status === 409) {
              // <-- Specific check for 409
              errorMessage = "You have already joined this challenge.";
            } else if (response.status === 400)
              errorMessage = "Cannot join this challenge at this time.";
            else if (response.status === 401)
              errorMessage = "Please log in to join.";
            else if (response.status === 404)
              errorMessage = "Challenge not found.";
            else errorMessage = `Request failed (Status: ${response.status})`;
          }
        } catch (jsonError) {
          errorMessage = `Request failed (Status: ${response.status})`;
        }
        // --- Check specifically for 409 before throwing generic error ---
        if (response.status === 409) {
          console.warn(`User already joined challenge ${challengeId}`);
          // Update UI state directly if needed (optional, depends on desired UX)
          // setChallenges(prev => prev.map(c => c.id === challengeId ? {...c, joined: true} : c));
          toast.info(errorMessage); // Use info toast for "already joined"
        } else {
          throw new Error(errorMessage); // Throw for other errors
        }
      } else {
        // --- Success Handling ---
        const joinedData = await response.json();
        console.log("Join successful:", joinedData);
        setChallenges((prevChallenges) =>
          prevChallenges.map((challenge) =>
            challenge.id === challengeId
              ? {
                  ...challenge,
                  joined: true,
                  participants: (challenge.participants ?? 0) + 1,
                } // Ensure participants exists
              : challenge
          )
        );
        toast.success("Successfully joined the challenge!");
      }
    } catch (err) {
      console.error("handleJoinChallenge Caught Error:", err);
      // Display error message using toast or alert
      if (
        err instanceof Error &&
        err.message !== "You have already joined this challenge."
      ) {
        // Don't show error toast if it was just 409 info
        toast.error(err.message);
      }
    } finally {
      setJoiningId(null);
    }
  };

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Wellness Challenges</h2>
      </div>

      {challenges.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No active challenges at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{challenge.title}</CardTitle>
                  <Badge
                    variant={
                      challenge.type === "team" ? "secondary" : "outline"
                    }
                  >
                    {challenge.type === "team" ? "Team" : "Individual"}
                  </Badge>
                </div>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Ends{" "}
                      {formatDistanceToNow(new Date(challenge.endDate), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{challenge.participants} participants</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onSelectChallenge(challenge.id)}
                >
                  View Progress
                </Button>
                {challenge.joined ? (
                  <Button variant="secondary" className="flex-1" disabled>
                    Joined
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={() => handleJoinChallenge(challenge.id)}
                    disabled={joiningId === challenge.id}
                  >
                    {joiningId === challenge.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Challenge"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
