// app/app/ideas/IdeaPageClient.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { IdeaList } from '@/components/ideas/IdeaList';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import { useIdeas } from '@/hooks/ideas/useIdeas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Lightbulb } from 'lucide-react';
import { Idea } from '@/hooks/ideas/useIdeas';

export function IdeaPageClient() {
  const [isIdeaFormModalOpen, setIsIdeaFormModalOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState<{ sortBy: 'createdAt' | 'votes', order: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    order: 'desc',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    refetch, // To refetch when sort changes
  } = useIdeas({ sortBy: currentSort.sortBy, order: currentSort.order });

  const allIdeas: Idea[] = data?.pages.flatMap(page => page.data) || [];

  const handleSubmissionComplete = () => {
    setIsIdeaFormModalOpen(false);
  };

  const handleSortChange = (sortBy: 'createdAt' | 'votes', order: 'asc' | 'desc') => {
    setCurrentSort({ sortBy, order });
    // `useIdeas` hook will refetch due to queryKey change if `sortBy` or `order` are part of queryKey
    // Or, explicitly refetch if the queryKey structure in useIdeas doesn't automatically trigger it for new sort params.
    // The current useIdeas hook *does* include sortBy and order in the queryKey, so it should refetch.
  };


  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-center sm:justify-end">
        <Dialog open={isIdeaFormModalOpen} onOpenChange={setIsIdeaFormModalOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
              <Lightbulb className="mr-2 h-5 w-5" /> Pitch an Idea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">Pitch Your Brilliant Idea</DialogTitle>
              <DialogDescription>
                Got an idea to improve Kanaka? Share it here! Provide details and choose a category.
              </DialogDescription>
            </DialogHeader>
            <IdeaForm onSubmissionComplete={handleSubmissionComplete} />
          </DialogContent>
        </Dialog>
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