// lib/utils/date-helpers.ts
import { format, formatDistanceToNowStrict } from 'date-fns';

/**
 * Formats a date into a common short format (e.g., "Sep 5, 2023").
 * Handles potential string or Date input. Returns empty string on invalid date.
 * @param dateInput - The date (string or Date object).
 * @returns Formatted date string or empty string.
 */
export const formatShortDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return ''; // Check for invalid date
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error("Error formatting short date:", error);
    return '';
  }
};

/**
 * Formats a date into a common date and time format (e.g., "Sep 5, 2023, 4:15 PM").
 * Handles potential string or Date input. Returns empty string on invalid date.
 * @param dateInput - The date (string or Date object).
 * @returns Formatted date & time string or empty string.
 */
export const formatDateTime = (dateInput: string | Date | null | undefined): string => {
   if (!dateInput) return '';
   try {
     const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
     if (isNaN(date.getTime())) return '';
     return format(date, 'MMM d, yyyy, p'); // 'p' is locale-aware time
   } catch (error) {
     console.error("Error formatting date/time:", error);
     return '';
   }
};

/**
 * Formats a date into just the time (e.g., "4:15 PM").
 * Handles potential string or Date input. Returns empty string on invalid date.
 * @param dateInput - The date (string or Date object).
 * @returns Formatted time string or empty string.
 */
export const formatTime = (dateInput: string | Date | null | undefined): string => {
   if (!dateInput) return '';
   try {
     const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
     if (isNaN(date.getTime())) return '';
     return format(date, 'p'); // 'p' is locale-aware time
   } catch (error) {
     console.error("Error formatting time:", error);
     return '';
   }
};


/**
 * Returns a human-readable distance string (e.g., "5 minutes ago", "in 2 days").
 * Handles potential string or Date input. Returns empty string on invalid date.
 * @param dateInput - The date (string or Date object).
 * @param options - Optional settings for formatDistanceToNowStrict.
 * @returns Relative time string or empty string.
 */
export const formatDistanceToNow = (
    dateInput: string | Date | null | undefined,
    options?: { addSuffix?: boolean; unit?: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'; roundingMethod?: 'floor' | 'ceil' | 'round'; }
): string => {
    if (!dateInput) return '';
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return '';
        return formatDistanceToNowStrict(date, options);
    } catch (error) {
        console.error("Error formatting distance to now:", error);
        return '';
    }
};