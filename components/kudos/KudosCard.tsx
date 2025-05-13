// components/kudos/KudosCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns"; // For relative time
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // Use Card parts
import { ThumbsUp, MessageSquare, Share2, Award, UserIcon } from "lucide-react"; // Use ThumbsUp
import { cn } from "@/lib/utils";
import { type KudosData } from "@/types/kudos"; // Adjust path
import { Badge } from "../ui/badge";

interface KudosCardProps {
  kudos: KudosData;
  className?: string;
}

export const KudosCard = ({ kudos, className }: KudosCardProps) => {
  if (!kudos) return null;

  // --- State for Interactions (Keep placeholders) ---
  const [isLiked, setIsLiked] = useState(false); // Replace with actual user like status if available
  const [likeCount, setLikeCount] = useState(kudos?.likes || 0); // Replace with actual like count if available

  // --- Handlers (Keep placeholders) ---
  const handleLike = () => {
    // TODO: Implement actual like API call and update logic
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    console.log("Like action triggered");
  };

  const handleComment = () => {
    // TODO: Implement comment viewing/adding logic (e.g., open a modal)
    console.log("Comment action triggered");
  };

  const handleShare = () => {
    // TODO: Implement sharing logic (e.g., copy link)
    console.log("Share action triggered");
  };

  // --- Relative Time Formatting ---
  const timeAgo = formatDistanceToNowStrict(new Date(kudos.createdAt), {
    addSuffix: true,
  });

  // --- Animation ---
  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  // --- Helper to get Initials ---
  const getInitials = (name?: string | null): string => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || ""
    );
  };

  return (
    // Use motion.div wrapping the Shadcn Card
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className={cn("mb-6 md:mb-8", className)} // Add bottom margin for spacing
    >
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-card pt-1">
        {/* Header: Giver -> Receiver Info */}
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between gap-2">
            {/* Giver */}
            <Link
              href={`/app/profile/${kudos.giver?.id}`}
              className="flex items-center gap-2 group min-w-0"
            >
              <Avatar className="h-8 w-8 border">
                <AvatarImage
                  src={kudos.giver?.image || undefined}
                  alt={kudos.giver?.name || "User"}
                />
                <AvatarFallback className="text-xs">
                  {kudos.giver?.name ? (
                    getInitials(kudos.giver.name)
                  ) : (
                    <UserIcon size={14} />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {kudos.giver?.name || "Anonymous"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {kudos.giver?.role || "Member"}
                </span>
              </div>
            </Link>

            {/* Award Icon */}
            <div className="flex-shrink-0 px-2">
              <Award className="h-5 w-5 text-primary/80" />
            </div>

            {/* Receiver */}
            <Link
              href={`/app/profile/${kudos.receiver?.id}`}
              className="flex items-center gap-2 group min-w-0 justify-end"
            >
              <div className="flex flex-col overflow-hidden items-end">
                <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {kudos.receiver?.name || "Anonymous"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {kudos.receiver?.role || "Member"}
                </span>
              </div>
              <Avatar className="h-8 w-8 border">
                <AvatarImage
                  src={kudos.receiver?.image || undefined}
                  alt={kudos.receiver?.name || "User"}
                />
                <AvatarFallback className="text-xs">
                  {kudos.receiver?.name ? (
                    getInitials(kudos.receiver.name)
                  ) : (
                    <UserIcon size={14} />
                  )}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </CardHeader>

        {/* Content: Message */}
        <CardContent className="pb-1 p-4 pt-1">
          {/* Display Categories as Badges */}
          {kudos.kudosCategories && kudos.kudosCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {kudos.kudosCategories.map(({ category }) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {/* Optional: Add icon based on category.iconName */}
                  {category.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Message */}
          <p className="text-sm text-foreground/90 leading-relaxed">
            {kudos.message}
          </p>
        </CardContent>

        {/* Footer: Timestamp & Actions */}
        <CardFooter className="px-4 pb-0 pt-1 flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{timeAgo}</span>

          <div className="flex items-center gap-1">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={cn(
                "h-7 w-7 text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10",
                isLiked && "text-pink-500 dark:text-pink-400"
              )}
            >
              <ThumbsUp className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span className="sr-only">Like ({likeCount})</span>
            </Button>
            {/* Display Like Count subtly */}
            {likeCount > 0 && (
              <span className="text-muted-foreground font-medium pr-1">
                {likeCount}
              </span>
            )}

            {/* Comment Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleComment}
              className="h-7 w-7 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="sr-only">Comment ({kudos.comments || 0})</span>
            </Button>
            {/* Display Comment Count subtly */}
            {(kudos.comments || 0) > 0 && (
              <span className="text-muted-foreground font-medium pr-1">
                {kudos.comments}
              </span>
            )}

            {/* Share Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-7 w-7 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
            >
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
