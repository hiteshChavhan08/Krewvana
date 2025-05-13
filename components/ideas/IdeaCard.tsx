// components/ideas/IdeaCard.tsx
"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageSquareText, Zap, CalendarDays } from "lucide-react"; // Zap for "innovative"
import { formatDistanceToNow } from "date-fns";
import { Idea } from "@/hooks/ideas/useIdeas";
import { useVoteIdea } from "@/hooks/ideas/useVoteIdea";
import { useCurrentUser } from "@/hooks/useCurrentUser"; // Assuming you have this
import { cn } from "@/lib/utils"; // For conditional class names
import { BackgroundGradient } from "@/components/ui/background-gradient"; // Optional for styling
import { toast, toastError } from "@/utils/toast";

interface IdeaCardProps {
  idea: Idea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const currentUser = useCurrentUser();
  const voteMutation = useVoteIdea();

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click or other parent events
    if (!currentUser) {
      toastError("Please log in to vote.");
      return;
    }
    voteMutation.mutate(idea.id);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <BackgroundGradient className="rounded-[22px] p-0.5 bg-white dark:bg-zinc-900">
      <Card className="h-full flex flex-col border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3">
          {idea.category && idea.category.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {idea.category.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          )}
          <CardTitle className="text-xl font-semibold leading-tight flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" /> {idea.title}
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-muted-foreground line-clamp-3">
            {idea.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow py-2">
          {/* Can add more details here if needed, or a link to a full idea page */}
        </CardContent>
        <CardFooter className="text-xs pt-3 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={idea.submittedBy?.image || undefined}
                alt={idea.submittedBy?.name || "User"}
              />
              <AvatarFallback>
                {getInitials(idea.submittedBy?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span>{idea.submittedBy?.name || "Anonymous"}</span>
              <span className="text-xs flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />{" "}
                {formatDistanceToNow(new Date(idea.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <Button
            onClick={handleVote}
            disabled={voteMutation.isPending || !currentUser}
            variant={idea.currentUserVoted ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex items-center gap-1.5 transition-all",
              idea.currentUserVoted &&
                "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1"
            )}
          >
            <ThumbsUp
              className={cn("h-4 w-4", idea.currentUserVoted && "fill-current")}
            />
            <span>
              {idea.voteCount} Vote{idea.voteCount !== 1 ? "s" : ""}
            </span>
          </Button>
        </CardFooter>
      </Card>
    </BackgroundGradient>
  );
}
