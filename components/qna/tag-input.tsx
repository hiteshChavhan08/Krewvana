// components\qna\tag-input.tsx
"use client";

import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X as LucideX } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- FIX IS HERE ---
// Omit the conflicting 'onChange' from InputHTMLAttributes
interface TagInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string[]; // Keep your specific value type
  onChange: (newValue: string[]) => void; // Keep your specific onChange type
  maxTags?: number;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  badgeClassName?: string;
}
// --- END FIX ---

export function TagInput({
  value = [],
  onChange,
  maxTags = 5,
  placeholder = "Add tags...",
  className,
  inputClassName,
  badgeClassName,
  disabled,
  ...props // Pass rest of the input props (excluding the omitted ones)
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  // This function handles the internal <input>'s change event
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // ... (rest of handleKeyDown logic remains the same) ...
     if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault(); // Prevent default form submission on Enter

      const newTag = inputValue.trim().toLowerCase(); // Convert to lower case? Optional.

      if (
        newTag && // Tag is not empty
        !value.includes(newTag) && // Tag is not a duplicate
        value.length < maxTags // Tag limit not reached
      ) {
        onChange([...value, newTag]); // Update parent state
        setInputValue(''); // Clear the input
      } else if (value.length >= maxTags) {
        console.warn(`Max tags limit (${maxTags}) reached.`);
        setInputValue(''); // Clear input even if max reached
      } else if (value.includes(newTag)) {
          console.warn(`Tag "${newTag}" already exists.`);
          setInputValue(''); // Clear input even if duplicate
      } else {
          setInputValue('');
      }
    } else if (event.key === 'Backspace' && !inputValue && value.length > 0) {
      event.preventDefault();
      removeTag(value[value.length - 1]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const isMaxTagsReached = value.length >= maxTags;

  return (
    <div className={cn('flex flex-wrap items-center gap-2 p-2 border border-input rounded-md', className)}>
      {value.map((tag) => (
         <Badge
          key={tag}
          variant="secondary"
          className={cn('flex items-center gap-1 whitespace-nowrap', badgeClassName)}
        >
          {tag}
          {!disabled && ( // Only show remove button if not disabled
            <Button
              type="button" // Important: Prevent form submission
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1 rounded-full hover:bg-destructive/80 hover:text-destructive-foreground"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              <LucideX className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue} // Use internal state for input value
        onChange={handleInputChange} // Use internal handler for input change
        onKeyDown={handleKeyDown}
        placeholder={isMaxTagsReached ? `Max ${maxTags} tags reached` : placeholder}
        className={cn(
          'flex-1 border-none shadow-none focus-visible:ring-0 h-auto py-0 px-1 min-w-[80px] bg-transparent',
           inputClassName
        )}
        disabled={isMaxTagsReached || disabled}
        {...props} // Spread remaining props like 'id', 'name', 'ref', 'onBlur' etc.
      />
    </div>
  );
}