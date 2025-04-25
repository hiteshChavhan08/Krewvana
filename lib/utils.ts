import { clsx, type ClassValue } from "clsx"
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNowStrict(date, { addSuffix: true });
}


export function sanitizeHtml(htmlString: string): string {
  // Basic sanitization: Remove script tags. Replace with a proper library for production.
  const clean = htmlString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Add more rules as needed (e.g., remove onerror attributes)
  return clean;
}