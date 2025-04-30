// components/search/UserSearchSelect.tsx (Create this new file/directory)
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command"; // Use Command components for structure & filtering (optional)
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils/helpers"; // Import your helper
import { useDebounce } from "@/lib/hooks/use-debounce"; // Import debounce hook
import { SimpleUser } from "@/types/types"; // Import shared type
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface UserSearchSelectProps {
  selectedUser: SimpleUser | null;
  onUserSelect: (user: SimpleUser | null) => void;
  placeholder?: string;
  className?: string;
  excludeUserId?: string; // Optional: ID of user to exclude (e.g., self)
}

async function searchUsers(
  query: string,
  excludeId?: string
): Promise<SimpleUser[]> {
  // Return type is correct (array of users)
  if (!query) return [];
  try {
    let apiUrl = `/api/users?limit=10&search=${encodeURIComponent(query)}`;
    if (excludeId) {
      apiUrl += `&excludeId=${excludeId}`;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error("Failed to fetch users:", response.statusText);
      return [];
    }
    // 👇 *** THE FIX IS HERE *** 👇
    const result = await response.json(); // Get the full object { data: [], pagination: {} }
    // Return the 'data' array, or an empty array if 'data' is missing/null
    return (result?.data || []) as SimpleUser[];
    // 👆 *** END OF FIX *** 👆
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}

export function UserSearchSelect({
  selectedUser,
  onUserSelect,
  placeholder = "Search name or email...",
  className,
  excludeUserId,
}: UserSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SimpleUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      setIsLoading(true);
      searchUsers(debouncedSearchQuery, excludeUserId).then((users) => {
        setResults(users);
        setIsLoading(false);
        if (!isPopoverOpen && users.length > 0) {
          // Open popover automatically if results found and it wasn't open
          // setIsPopoverOpen(true); // This can sometimes be jarring, maybe open on focus instead
        } else if (users.length === 0) {
          // Keep popover open to show "No results"
        }
      });
    } else {
      setResults([]); // Clear results if query is empty
      setIsLoading(false);
      // Don't close popover immediately on clear, user might be correcting typo
    }
  }, [debouncedSearchQuery, isPopoverOpen, excludeUserId]);

  const handleSelect = (user: SimpleUser) => {
    onUserSelect(user);
    setSearchQuery(user.name || user.email || ""); // Show selected user name in input
    setIsPopoverOpen(false); // Close popover on selection
    setResults([]); // Clear results list
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent popover trigger if inside input wrapper
    onUserSelect(null);
    setSearchQuery("");
    setResults([]);
    setIsPopoverOpen(false);
    inputRef.current?.focus(); // Refocus input after clearing
  };

  // Handle input changes and opening popover
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query && !isPopoverOpen) {
      setIsPopoverOpen(true); // Open if user starts typing
    } else if (!query) {
      // Optional: close popover if input is cleared? Or keep open?
      // setIsPopoverOpen(false);
    }
    // Clear selection if user types something different than selected name
    if (
      selectedUser &&
      query !== (selectedUser.name || selectedUser.email || "")
    ) {
      onUserSelect(null);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <div className={cn("relative", className)}>
        {/* Use PopoverAnchor to position popover relative to input */}
        <PopoverAnchor asChild>
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onClick={() =>
              !isPopoverOpen && searchQuery && setIsPopoverOpen(true)
            } // Open on click if has query
            onFocus={() => !selectedUser && setIsPopoverOpen(true)} // Open on focus if nothing selected
            className="pr-8" // Add padding for clear button
          />
        </PopoverAnchor>
        {/* Clear Button */}
        {(selectedUser || searchQuery) && (
          <Button
            variant="ghost"
            size="sm" // Adjust size as needed
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0" // Match trigger width, remove padding
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
      >
        <Command shouldFilter={false}>
          {" "}
          {/* API handles filtering */}
          {/* Optional: Add back CommandInput if needed, but focus should stay on main input */}
          {/* <CommandInput placeholder="Search..." value={searchQuery} onValueChange={setSearchQuery} /> */}
          <CommandList>
            {isLoading && (
              <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}
            {!isLoading && debouncedSearchQuery && results.length === 0 && (
              <CommandEmpty>No users found.</CommandEmpty>
            )}
            {!isLoading && results.length > 0 && (
              <ScrollArea className="max-h-[200px]">
                {" "}
                {/* Limit height */}
                {results.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.name || user.email || user.id} // Value for potential filtering/selection
                    onSelect={() => handleSelect(user)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user.name ?? "Unnamed User"}
                      </span>
                      {user.email && (
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      )}
                    </div>
                    {selectedUser?.id === user.id && (
                      <Check className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </ScrollArea>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
