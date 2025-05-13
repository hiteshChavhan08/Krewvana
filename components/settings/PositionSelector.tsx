// components/settings/PositionSelector.tsx
"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { VerificationBadge } from "./VerificationBadge";
import { Loader2, AlertTriangle } from "lucide-react"; // Import icons
import { cn } from "@/lib/utils";

type Position = { id: string; name: string };

// API fetch function - ensure this correctly fetches and parses data
async function fetchPositions(): Promise<Position[]> {
  console.log("--- fetchPositions CALLED ---");
  try {
    const response = await fetch("/api/positions");
    console.log("--- fetchPositions response status:", response.status);
    if (!response.ok) {
      // Try to get more specific error from response body
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    console.log("--- fetchPositions data returned:", data);
    // FIX: Return the data directly if it's an array, otherwise empty array
    return Array.isArray(data) ? (data as Position[]) : [];
  } catch (err) {
    console.error("--- fetchPositions ERROR:", err);
    // It's important to re-throw for useQuery's isError state
    throw err;
  }
}

interface PositionSelectorProps {
  label?: string;
  currentPositionId: string | null | undefined;
  isVerified: boolean | null | undefined;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
}

export const PositionSelector: React.FC<PositionSelectorProps> = ({
  label = "Position",
  currentPositionId,
  isVerified,
  onValueChange,
  disabled = false,
}) => {
  console.log("PositionSelector received disabled prop:", disabled);
  const {
    data: positions = [], // Default to empty array
    isLoading,
    isError,
    error,
  } = useQuery<Position[]>({
    queryKey: ["positions"],
    queryFn: fetchPositions,
    staleTime: 1000 * 60 * 60,
    enabled: !disabled, // Use the actual disabled prop status
    // enabled: true, // Keep forced true ONLY if still debugging the fetch itself
  });

  //   const { data: positions = [], isLoading, isError, error } = queryResult;
  const selectedPositionName = positions.find(
    (p) => p.id === currentPositionId
  )?.name;

  // Show skeleton only for the trigger if data hasn't loaded at all yet
  // This prevents the whole component disappearing during background refetches
  if (isLoading && !positions.length) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="position-select-loading">{label}</Label>
          {/* Maybe show skeleton for badge too? */}
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="position-select">{label}</Label>
        <VerificationBadge isVerified={isVerified} />
      </div>
      <Select
        value={currentPositionId ?? ""}
        onValueChange={(value) => onValueChange(value === "" ? null : value)}
        disabled={disabled || isLoading} // Also disable trigger slightly while loading? Optional.
        name="positionId"
      >
        <SelectTrigger
          id="position-select"
          className={cn(isError && "border-destructive")}
        >
          {/* Display selected name or placeholder */}
          <SelectValue placeholder="-- Select Position --">
            {selectedPositionName ? <span>{selectedPositionName}</span> : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* --- Loading State within Dropdown --- */}
          {isLoading && (
            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading positions...
            </div>
          )}
          {/* --- Error State within Dropdown --- */}
          {isError &&
            !isLoading && ( // Show error only if not loading
              <div className="flex flex-col items-center justify-center p-4 text-sm text-destructive">
                <AlertTriangle className="mr-2 h-4 w-4 mb-1" />
                <span>Failed to load positions.</span>
                {/* Optional: Show specific error message */}
                {/* <span className="text-xs mt-1">({error?.message})</span> */}
              </div>
            )}
          {/* --- Data State within Dropdown --- */}
          {!isLoading && !isError && (
            <>
              {positions.length === 0 && (
                <div className="p-4 text-sm text-center text-muted-foreground">
                  No positions available.
                </div>
              )}
              {positions.map((pos) => (
                <SelectItem key={pos.id} value={pos.id}>
                  {pos.name}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Changing your position will require admin verification.
      </p>
    </div>
  );
};
