// components/settings/PositionSelector.tsx
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { VerificationBadge } from './VerificationBadge';
import { Loader2, AlertTriangle } from 'lucide-react'; // Import icons
import { cn } from '@/lib/utils';

type Position = { id: string; name: string };

// API fetch function - ensure this correctly fetches and parses data
async function fetchPositions(): Promise<Position[]> {
    const res = await fetch('/api/positions');
    if (!res.ok) {
        // Log error but throw for useQuery to catch
        console.error("Position API Error:", res.status, await res.text().catch(() => ""));
        throw new Error('Failed to fetch positions');
    }
    // Assuming API returns { data: [...] } - adjust if needed
    const result = await res.json();
    return (result?.data || []) as Position[];
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
  const {
      data: positions = [],
      isLoading,
      isError,
      error // Capture error object
    } = useQuery<Position[]>({
        queryKey: ['positions'],
        queryFn: fetchPositions,
        staleTime: 1000 * 60 * 60, // Cache positions for an hour, they don't change often
        enabled: !disabled, // Fetch only if component is enabled
  });

  // Determine the text displayed in the trigger button
  const selectedPositionName = positions.find(p => p.id === currentPositionId)?.name;

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
            <SelectTrigger id="position-select" className={cn(isError && "border-destructive")}>
                {/* Display selected name or placeholder */}
                <SelectValue placeholder="-- Select Position --">
                    {selectedPositionName}
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
                {isError && !isLoading && ( // Show error only if not loading
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