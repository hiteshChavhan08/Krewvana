"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Award, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KudosData } from "@/types/kudos";

interface KudosCardProps {
  // UNCOMMENT THIS WHEN IMPLEMENTING WITH REAL DATA
  kudos: KudosData;
  className?: string;
}

export const KudosCard = ({
  // UNCOMMENT THIS WHEN IMPLEMENTING WITH REAL DATA
  kudos,
  className,
}: KudosCardProps) => {
  // REMOVE THIS LINE WHEN IMPLEMENTING WITH REAL DATA
  // const kudos = DUMMY_KUDOS
  if (!kudos) return null;

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(kudos?.likes || 0);

  // Animation variants for card elements
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  // Handle like button click
  const handleLike = () => {
    // IMPLEMENT ACTUAL LIKE FUNCTIONALITY HERE
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-white dark:bg-gray-900",
        "border border-gray-100 dark:border-gray-800",
        "shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)]",
        "transition-all duration-300 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {/* Decorative top accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500" />

      <div className="p-6">
        {/* Header with category badge */}
        <div className="flex justify-between items-center mb-4">
          <Badge
            variant="outline"
            className="bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 px-3 py-1 rounded-full"
          >
            <Star className="h-3.5 w-3.5 mr-1 inline" />
            {kudos.category}
          </Badge>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(kudos.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* User profiles section */}
        <div className="flex items-center justify-between mb-6">
          {/* Giver profile */}
          <Link href={`/app/profile/${kudos?.giver?.id}`} className="group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-900 shadow-sm">
                  <AvatarImage
                    src={kudos?.giver?.image || "/placeholder.svg"}
                    alt={kudos?.giver?.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                    {kudos?.giver?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  className="absolute inset-0 rounded-full bg-violet-400/20 z-0"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.3, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {kudos?.giver?.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {kudos?.giver?.role}
                </span>
              </div>
            </div>
          </Link>

          {/* Award icon in the middle */}
          <div className="relative mx-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full bg-amber-300/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.3, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            />
          </div>

          {/* Receiver profile */}
          <Link href={`/app/profile/${kudos?.receiver?.id}`} className="group">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="font-medium text-sm group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                  {kudos?.receiver?.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {kudos?.receiver?.role}
                </span>
              </div>
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-900 shadow-sm">
                  <AvatarImage
                    src={kudos?.receiver?.image || "/placeholder.svg"}
                    alt={kudos?.receiver?.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white">
                    {kudos?.receiver?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  className="absolute inset-0 rounded-full bg-fuchsia-400/20 z-0"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.3, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </Link>
        </div>

        {/* Message content */}
        <div className="relative my-6">
          <div className="absolute -left-1 top-0 h-full w-1 bg-gradient-to-b from-violet-400 to-fuchsia-500 rounded-full" />
          <div className="pl-4">
            <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-base">
              {kudos.message}
            </p>
          </div>
        </div>

        {/* Interaction footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "gap-2 text-gray-500 dark:text-gray-400",
              isLiked && "text-pink-500 dark:text-pink-400"
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isLiked &&
                  "fill-pink-500 text-pink-500 dark:fill-pink-400 dark:text-pink-400"
              )}
            />
            <span>{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-500 dark:text-gray-400"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{kudos.comments}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-500 dark:text-gray-400"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
