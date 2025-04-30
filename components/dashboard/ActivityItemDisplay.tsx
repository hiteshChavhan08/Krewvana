// components/dashboard/ActivityItemDisplay.tsx
"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Award, PartyPopper, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Optional: Add Avatars
import { type ActivityItem } from "@/types/dashboard"; // Adjust path
import { getInitials } from "@/lib/utils/helpers"; // Adjust path

interface ActivityItemDisplayProps {
  item: ActivityItem;
}

export const ActivityItemDisplay: React.FC<ActivityItemDisplayProps> = ({ item }) => {
  const Icon = item.type === "kudos" ? Award : PartyPopper;
  const iconColor = item.type === "kudos" ? "text-primary" : "text-pink-500";

  return (
    <div className="flex items-center gap-3 text-sm border-b pb-3 last:border-b-0">
       {/* Optional Avatar */}
       {/* <Avatar className="h-6 w-6">
         <AvatarImage src={item.actorImage ?? undefined} />
         <AvatarFallback className="text-xs">{getInitials(item.actorName)}</AvatarFallback>
       </Avatar> */}
      <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
      <div className="flex-grow overflow-hidden">
        <p className="truncate leading-snug"> {/* Improve line height */}
          <span className="font-medium">{item.actorName || "Someone"}</span>
          {item.type === "kudos" && item.receiverName && (
            <> gave Kudos to <span className="font-medium">{item.receiverName}</span></>
          )}
          {item.type === "shoutout" && (
            <> posted a <span className="font-medium">{item.shoutoutType || "Shoutout"}</span></>
          )}
          {item.message ? `: "${item.message}"` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </p>
      </div>
      <Button variant="ghost" size="sm" asChild className="ml-auto flex-shrink-0 px-2">
        <Link href={item.type === "kudos" ? "/app/kudos" : "/app/shoutouts"}> {/* Adjust paths */}
          View <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </Button>
    </div>
  );
};