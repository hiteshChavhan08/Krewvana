// components/leaderboard/LeaderboardTable.tsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type LeaderboardUser } from "@/types/leaderboard"; // Adjust path
import { getInitials } from "@/lib/utils/helpers"; // Adjust path
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";

interface LeaderboardTableProps {
  users: LeaderboardUser[];
  highlightUserId?: string | null; // Optional: ID of the current user to highlight
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  users,
  highlightUserId,
}) => {
  if (!users || users.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No further rankings available.
      </p>
    );
  }

  return (
    // Use a card for better visual grouping and background
    <Card className="mt-8 shadow-md bg-transparent">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px] text-center">Rank</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right pr-4 md:pr-6">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className={cn(
                "hover:bg-muted/50",
                user.id === highlightUserId &&
                  "bg-primary/10 dark:bg-primary/20 font-semibold" // Highlight style
              )}
            >
              <TableCell className="text-center font-medium align-middle text-muted-foreground">
                {user.rank}
              </TableCell>
              <TableCell className="align-middle py-2">
                {" "}
                {/* Reduced padding */}
                <Link
                  href={`/app/profile/${user.id}`}
                  className="flex items-center space-x-3 group"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name ?? "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Use text-foreground for highlighted row */}
                  <span
                    className={cn(
                      "truncate group-hover:text-primary",
                      user.id === highlightUserId && "text-foreground"
                    )}
                  >
                    {user.name || "Anonymous User"}
                  </span>
                </Link>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold align-middle pr-4 md:pr-6",
                  user.id === highlightUserId && "text-foreground"
                )}
              >
                {user.points.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
