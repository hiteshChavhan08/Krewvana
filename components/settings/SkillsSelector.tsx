// components/settings/SkillsSelector.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, PlusCircle } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce"; // Adjust path
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Assume Skill type is { id: string; name: string } from types/user or types/skill
import { type SkillData as Skill } from "@/types/user"; // Use consistent type alias

// API fetch function for skills search
async function searchSkillsApi(query: string): Promise<Skill[]> {
  if (!query) return [];
  try {
    // Assuming /api/skills returns { data: Skill[] } structure
    const res = await fetch(
      `/api/skills?search=${encodeURIComponent(query)}&limit=8`
    );
    if (!res.ok) {
      console.error("Skills API Error:", res.statusText);
      return [];
    }
    const result = await res.json();
    // 👇 *** FIX: Extract the 'data' array *** 👇
    return (result?.data || []) as Skill[];
  } catch (error) {
    console.error("Error searching skills:", error);
    return [];
  }
}

interface SkillsSelectorProps {
  label?: string;
  selectedSkills: Skill[];
  onChange: (newSkills: Skill[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const SkillsSelector: React.FC<SkillsSelectorProps> = ({
  label = "Skills",
  selectedSkills = [],
  onChange,
  disabled = false,
  placeholder = "Add skills (e.g., React, Python...)",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(inputValue, 300);

  const { data: searchResults = [], isLoading } = useQuery<Skill[]>({
    queryKey: ["skillSearch", debouncedSearchTerm],
    queryFn: () => searchSkillsApi(debouncedSearchTerm),
    enabled: !!debouncedSearchTerm && !disabled && isOpen, // Only fetch when popover is open and user is typing
  });

  const handleSelectSkill = (skill: Skill) => {
    if (
      !selectedSkills.some(
        (s) =>
          s.id === skill.id || s.name.toLowerCase() === skill.name.toLowerCase()
      )
    ) {
      onChange([...selectedSkills, skill]);
    }
    setInputValue("");
    setIsOpen(false);
  };

  const handleCreateSkill = (skillName: string) => {
    const trimmedName = skillName.trim();
    if (
      trimmedName &&
      !selectedSkills.some(
        (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      const newSkill = {
        id: `new_${trimmedName.toLowerCase()}`,
        name: trimmedName,
      };
      onChange([...selectedSkills, newSkill]);
    }
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemoveSkill = (skillIdOrName: string) => {
    onChange(
      selectedSkills.filter(
        (s) => s.id !== skillIdOrName && s.name !== skillIdOrName
      )
    );
  };

  const availableOptions = searchResults.filter(
    (result) =>
      !selectedSkills.some(
        (selected) => selected.name.toLowerCase() === result.name.toLowerCase()
      )
  );

  // Close popover if input is cleared and no results are loading/shown
  useEffect(() => {
    if (
      !inputValue &&
      !isLoading &&
      availableOptions.length === 0 &&
      !debouncedSearchTerm
    ) {
      setIsOpen(false);
    }
  }, [inputValue, isLoading, availableOptions.length, debouncedSearchTerm]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {/* Container for badges and input */}
      {/* Apply border directly here */}
      <div className="flex flex-wrap gap-1.5 p-2 border rounded-md min-h-[40px] items-center">
        {selectedSkills.map((skill) => (
          <Badge
            key={skill.id || skill.name}
            variant="secondary"
            className="flex items-center gap-1 shrink-0"
          >
            {skill.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill.id || skill.name)}
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-1"
                aria-label={`Remove ${skill.name}`}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </Badge>
        ))}
        {/* Input using Popover for suggestions */}
        {!disabled && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              {/* Input takes remaining space */}
              {/* Wrap input to easily position it */}
              <div className="flex-grow min-w-[150px]">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    selectedSkills.length === 0 ? placeholder : "+ Add more"
                  }
                  className="bg-transparent outline-none placeholder:text-muted-foreground text-sm w-full px-1 py-0.5" // Ensure some padding/height
                  onFocus={() => setIsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inputValue) {
                      e.preventDefault();
                      handleCreateSkill(inputValue);
                    }
                    if (
                      e.key === "Backspace" &&
                      !inputValue &&
                      selectedSkills.length > 0
                    ) {
                      e.preventDefault();
                      handleRemoveSkill(
                        selectedSkills[selectedSkills.length - 1].id
                      );
                    }
                  }}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0" // Use trigger width
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus steal
            >
              <Command shouldFilter={false}>
                <CommandList>
                  {isLoading && (
                    <CommandItem
                      disabled
                      className="flex items-center justify-center py-2"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Loading...
                    </CommandItem>
                  )}
                  {/* 👇 FIX: Add padding to CommandEmpty */}
                  {!isLoading &&
                    debouncedSearchTerm &&
                    availableOptions.length === 0 &&
                    !searchResults.some(
                      (s) => s.name.toLowerCase() === inputValue.toLowerCase()
                    ) && (
                      <CommandEmpty className="py-2 px-4 text-center text-sm">
                        {" "}
                        {/* Added padding */}
                        No results. Press Enter to add "{debouncedSearchTerm}".
                      </CommandEmpty>
                    )}
                  {/* Message when input is empty */}
                  {!isLoading &&
                    !debouncedSearchTerm &&
                    selectedSkills.length > 0 && (
                      <CommandEmpty className="py-2 px-4 text-center text-sm">
                        Type to search or add.
                      </CommandEmpty>
                    )}

                  {availableOptions.map((skill) => (
                    <CommandItem
                      key={skill.id}
                      onSelect={() => handleSelectSkill(skill)}
                      value={skill.name} // Value used by cmdk for navigation
                      className="cursor-pointer"
                    >
                      {skill.name}
                    </CommandItem>
                  ))}
                  {/* Option to create new */}
                  {inputValue &&
                    !isLoading &&
                    !availableOptions.some(
                      (s) => s.name.toLowerCase() === inputValue.toLowerCase()
                    ) &&
                    !selectedSkills.some(
                      (s) => s.name.toLowerCase() === inputValue.toLowerCase()
                    ) && (
                      <CommandItem
                        onSelect={() => handleCreateSkill(inputValue)}
                        value={`create-${inputValue}`} // Unique value
                        className="text-primary hover:!bg-primary/10 cursor-pointer"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Create "
                        {inputValue}"
                      </CommandItem>
                    )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {!disabled && (
        <p className="text-xs text-muted-foreground mt-1.5">
          {" "}
          {/* Add margin */}
          Add relevant skills. Press Enter to create a new one if not found.
        </p>
      )}
    </div>
  );
};
