// components/qna/tag-input.tsx
"use client";

import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Optional: for an explicit add button
import { cn } from "@/lib/utils";

interface TagInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  // Omit conflicting 'onChange' and 'value' from HTML input attributes
  value: string[]; // Define our own value type
  onChange: (tags: string[]) => void; // Define our own onChange type
  maxTags?: number;
  maxTagLength?: number;
  allowedCharsRegex?: RegExp;
  placeholder?: string;
  className?: string; // Keep className if needed for the outer div
}

export function TagInput({
  value = [], // Default to empty array
  onChange,
  maxTags = 5,
  maxTagLength = 25,
  // Simple regex: letters, numbers, plus, minus, dot (adjust as needed)
  allowedCharsRegex = /^[a-zA-Z0-9+-.]+$/,
  placeholder = "Add tags...",
  className,
  ...props // Pass other input props like 'disabled'
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError(null); // Clear error on input change
  };

  const addTag = (tagToAdd: string) => {
    const newTag = tagToAdd.trim();

    // --- Validation ---
    if (!newTag) return; // Don't add empty tags

    if (value.length >= maxTags) {
      setError(`You can add a maximum of ${maxTags} tags.`);
      return;
    }

    if (newTag.length > maxTagLength) {
      setError(`Tag cannot exceed ${maxTagLength} characters.`);
      return;
    }

    if (!allowedCharsRegex.test(newTag)) {
      setError(
        `Tag contains invalid characters. Use letters, numbers, +, -, .`
      );
      return;
    }

    const lowerCaseTag = newTag.toLowerCase();
    if (value.some((tag) => tag.toLowerCase() === lowerCaseTag)) {
      setError("Tag already exists.");
      // Optionally clear input even if duplicate
      // setInputValue('');
      return;
    }
    // --- End Validation ---

    onChange([...value, newTag]); // Update the parent form state
    setInputValue(""); // Clear the input field
    setError(null); // Clear any previous error
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
    setError(null); // Clear error when removing a tag
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault(); // Prevent form submission on Enter
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      // Optional: Remove last tag on backspace when input is empty
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex flex-wrap gap-2 rounded-md border border-input bg-background p-2", // Style like an input container
          className
        )}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
            <button
              type="button" // Prevent form submission
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              disabled={props.disabled}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            value.length >= maxTags ? "Maximum tags reached" : placeholder
          }
          className="flex-1 border-none shadow-none focus-visible:ring-0 h-auto p-0 m-0 bg-transparent" // Minimal styling to blend in
          disabled={value.length >= maxTags || props.disabled}
          aria-label="Add a new tag"
          {...props} // Pass down other props like id, name etc.
        />
      </div>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
