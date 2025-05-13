// /app/app/ideas/IdeaPageClient.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { IdeaList } from '@/components/ideas/IdeaList';
// import { IdeaForm } from '@/components/ideas/IdeaForm'; // No longer needed here
import { useIdeas } from '@/hooks/ideas/useIdeas';
import { Button } from '@/components/ui/button';
// Remove Dialog related imports if no longer used on this page
// import { Dialog, DialogContent, ... } from "@/components/ui/dialog";
import Link from 'next/link'; // Import Link
import { Lightbulb } from 'lucide-react';
import { Idea } from '@/hooks/ideas/useIdeas'; // Assuming this type is correct

export function IdeaPageClient() {
  // const [isIdeaFormModalOpen, setIsIdeaFormModalOpen] = useState(false); // Remove state for modal
  const [currentSort, setCurrentSort] = useState<{ sortBy: 'createdAt' | 'votes', order: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    order: 'desc',
  });

  const {
    data, fetchNextPage, hasNextPage, isLoading, isError, error, isFetchingNextPage,
  } = useIdeas({ sortBy: currentSort.sortBy, order: currentSort.order });

  const allIdeas: Idea[] = data?.pages.flatMap(page => page.data) || [];

  // Remove modal handler if not needed
  // const handleSubmissionComplete = () => {
  //   setIsIdeaFormModalOpen(false);
  // };

  const handleSortChange = (sortBy: 'createdAt' | 'votes', order: 'asc' | 'desc') => {
    setCurrentSort({ sortBy, order });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-center sm:justify-end">
         {/* --- START: Updated Button/Link --- */}
         <Button asChild variant="default" size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/app/ideas/new"> {/* Link to the new page */}
                <Lightbulb className="mr-2 h-5 w-5" /> Pitch an Idea
            </Link>
         </Button>
         {/* --- END: Updated Button/Link --- */}

        {/* --- REMOVE OLD DIALOG ---
        <Dialog open={isIdeaFormModalOpen} onOpenChange={setIsIdeaFormModalOpen}>
          <DialogTrigger asChild>
             <Button variant="default" size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
              <Lightbulb className="mr-2 h-5 w-5" /> Pitch an Idea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
             <DialogHeader>...</DialogHeader>
             <IdeaForm onSubmissionComplete={handleSubmissionComplete} /> // Form removed
          </DialogContent>
        </Dialog>
        --- END REMOVE OLD DIALOG --- */}

      </div>

      <IdeaList
        ideas={allIdeas}
        isLoading={isLoading && !allIdeas.length}
        isError={isError}
        error={error}
        fetchNextPage={fetchNextPage}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onSortChange={handleSortChange}
        currentSort={currentSort}
      />
    </div>
  );
}