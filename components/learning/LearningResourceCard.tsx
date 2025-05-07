// components/learning/LearningResourceCard.tsx
import React from 'react';
import NextLink from 'next/link'; // Aliased to avoid confusion with any other 'Link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { BackgroundGradient } from '@/components/ui/background-gradient'; // Assuming this path
import { Link as LinkIcon } from 'lucide-react'; // Link icon from lucide
import { formatDistanceToNow } from 'date-fns';
import { LearningResource } from '@/hooks/learning/useLearningResources';

interface LearningResourceCardProps {
  resource: LearningResource;
}

// Helper function to ensure URL is absolute and valid
const ensureAbsoluteUrl = (urlInput: string | null | undefined): string => {
  if (!urlInput || typeof urlInput !== 'string' || urlInput.trim() === '') {
    return '#'; // Return a safe, non-navigable href for invalid/empty inputs
  }
  let url = urlInput.trim();
  if (url.startsWith('//')) { // Protocol-relative URL
    return `https:${url}`; // Default to https
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`; // Prepend https if no scheme is present
  }
  return url;
};

export function LearningResourceCard({ resource }: LearningResourceCardProps) {
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // --- Debugging ---
  // Log the original URL from the resource object
  console.log(`[LearningResourceCard] Original URL for "${resource.title}":`, resource.url);

  const validatedUrl = ensureAbsoluteUrl(resource.url);

  // Log the URL that will be used in the href
  console.log(`[LearningResourceCard] Validated URL for "${resource.title}":`, validatedUrl);
  // --- End Debugging ---

  const isLinkEffectivelyValid = validatedUrl !== '#';

  return (
    <BackgroundGradient className="rounded-[22px] p-0.5 bg-white dark:bg-zinc-900 transform transition-all duration-300 hover:scale-[1.02]">
      <Card className="h-full flex flex-col border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold leading-tight">
            {resource.title}
          </CardTitle>
          {resource.description && (
            <CardDescription className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {resource.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow py-0">
          {isLinkEffectivelyValid ? (
            <Button variant="outline" size="sm" asChild className="mt-2">
              {/*
                - 'asChild' on Button makes it pass its props to the direct child.
                - NextLink (from next/link) is the child, it renders an <a> tag.
                - 'href' gets the validated URL.
                - 'target="_blank"' opens in a new tab.
                - 'rel="noopener noreferrer"' is a security best practice for target="_blank".
              */}
              <NextLink
                href={validatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
                // Adding an onClick for logging, not to prevent default behavior
                onClick={() => console.log(`[LearningResourceCard] Clicked "Visit Resource". Attempting to navigate to: ${validatedUrl}`)}
              >
                Visit Resource <LinkIcon className="h-4 w-4" />
              </NextLink>
            </Button>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground italic">
              (No valid link provided for this resource)
            </p>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-3 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={resource.submittedBy?.image || undefined} alt={resource.submittedBy?.name || 'User'} />
              <AvatarFallback>{getInitials(resource.submittedBy?.name)}</AvatarFallback>
            </Avatar>
            <span>{resource.submittedBy?.name || 'Anonymous User'}</span>
          </div>
          <span>{formatDistanceToNow(new Date(resource.submittedAt), { addSuffix: true })}</span>
        </CardFooter>
      </Card>
    </BackgroundGradient>
  );
}