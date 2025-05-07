// app/app/learning/LearningPageClient.tsx
"use client";
import React, { useState } from "react";
import { LearningResourceList } from "@/components/learning/LearningResourceList";
import { LearningResourceForm } from "@/components/learning/LearningResourceForm";
import {
  useLearningResources,
  PaginatedLearningResources,
  LearningResource,
} from "@/hooks/learning/useLearningResources";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
// Separator might not be needed, or used differently. Keeping for now.
// import { Separator } from '@/components/ui/separator';

export function LearningPageClient() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
  } = useLearningResources();

  const allResources: LearningResource[] =
    data?.pages.flatMap((page: PaginatedLearningResources) => page.data) || [];

  const handleSubmissionComplete = () => {
    setIsFormModalOpen(false); // Close the modal
  };

  return (
    <div className="space-y-8">
      {/* Section for Shared Knowledge and Add Resource Button */}
      <section aria-labelledby="shared-resources-heading">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2
            id="shared-resources-heading"
            className="text-2xl font-semibold text-center sm:text-left"
          >
            Shared Knowledge
          </h2>
          <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Share New Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Share a Learning Resource</DialogTitle>
                <DialogDescription>
                  Found something useful? Fill out the form below to share it
                  with the team.
                </DialogDescription>
              </DialogHeader>
              <LearningResourceForm
                onSubmissionComplete={handleSubmissionComplete}
              />
            </DialogContent>
          </Dialog>
        </div>

        <LearningResourceList
          resources={allResources}
          isLoading={isLoading && !allResources.length}
          isError={isError}
          error={error}
          fetchNextPage={fetchNextPage}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      </section>
      {/* The top-level form section is removed as it's now in a modal */}
      {/* The Separator might not be needed or could be placed differently if desired */}
      {/* <Separator className="my-10" /> */}
    </div>
  );
}
