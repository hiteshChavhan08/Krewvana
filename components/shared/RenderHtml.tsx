// FILE: components/shared/RenderHtml.tsx
import React from 'react';
import { sanitizeHtml } from '@/lib/utils'; // Import your sanitizer

interface RenderHtmlProps {
  htmlString: string;
  className?: string;
}

/**
 * Renders HTML content safely. Uses basic sanitization.
 * Consider server-side sanitization or a robust client-side library (like DOMPurify)
 * for production environments handling user-generated content.
 * Apply Tailwind typography styles here.
 */
const RenderHtml: React.FC<RenderHtmlProps> = ({ htmlString, className = '' }) => {
  // WARNING: Basic sanitization only. Review security implications.
  const cleanHtml = sanitizeHtml(htmlString);

  return (
    <div
      className={`prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default RenderHtml;