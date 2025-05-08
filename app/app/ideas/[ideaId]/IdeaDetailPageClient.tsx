// app/app/ideas/[ideaId]/IdeaDetailPageClient.tsx
"use client";
import React, { useState } from "react";
import { useDeleteIdea, useIdea, useUpdateIdea } from "@/hooks/ideas/useIdeas";
import { IdeaCommentList } from "@/components/ideas/IdeaCommentList";
import { IdeaCommentForm } from "@/components/ideas/IdeaCommentForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ThumbsUp,
  CalendarDays,
  MessageSquare,
  Zap,
  ChevronLeft,
  Edit3,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useVoteIdea } from "@/hooks/ideas/useVoteIdea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation"; // <--- CORRECTED IMPORT
import {
  IdeaFormUpdateValidationData, // This is good if IdeaForm's onSubmissionComplete provides this type
  IdeaUpdateAPIData, // This is what your API expects for update
  IdeaUnifiedFormData // This is what IdeaForm uses internally for useForm<T>
} from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IdeaForm } from "@/components/ideas/IdeaForm";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface IdeaDetailPageClientProps {
  ideaId: string;
}

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export function IdeaDetailPageClient({ ideaId }: IdeaDetailPageClientProps) {
  const {
    data: idea,
    isLoading,
    isError,
    error,
    // refetch: refetchIdea, // refetch from useIdea if needed after mutation
  } = useIdea(ideaId);
  const currentUser = useCurrentUser();
  const voteMutation = useVoteIdea();
  const updateIdeaMutation = useUpdateIdea();
  const deleteIdeaMutation = useDeleteIdea();
  const router = useRouter(); // Now correctly imported for App Router

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleVote = () => {
    if (!currentUser || !idea) {
      return;
    }
    voteMutation.mutate(idea.id);
  };

  const isAuthor = currentUser && idea && currentUser.id === idea.submittedById;
  const isAdmin = currentUser && currentUser.role === UserRole.ADMIN;
  const canModify = isAuthor || isAdmin;

  const handleDelete = async () => {
    if (!idea) return;
    deleteIdeaMutation.mutate(idea.id, {
      onSuccess: () => {
        // Ensure the path is correct for your routing structure
        router.push('/app/ideas'); // Or just '/ideas' if /app isn't part of URL path
      },
      // onError: (err) => { /* handle delete error */ }
    });
  };

  // The data from IdeaForm (onSubmissionComplete) should be Partial<IdeaUnifiedFormData>
  // We then map it to IdeaUpdateAPIData before sending to the mutation
  const handleEditSubmit = (formDataFromForm: Partial<IdeaUnifiedFormData>) => {
    if (!idea) return;

    // Construct the payload for the API (IdeaUpdateAPIData)
    // Only include fields that were actually part of the form and potentially changed.
    // IdeaUpdateAPIData from schema makes fields optional.
    const apiPayload: IdeaUpdateAPIData = {};
    if (formDataFromForm.title !== undefined) apiPayload.title = formDataFromForm.title;
    if (formDataFromForm.description !== undefined) apiPayload.description = formDataFromForm.description;
    if (formDataFromForm.category !== undefined) apiPayload.category = formDataFromForm.category;
    if (isAdmin && formDataFromForm.status !== undefined) apiPayload.status = formDataFromForm.status;


    // Ensure at least one field is being sent if your API requires it (IdeaUpdateAPISchema has a refine for this)
    if (Object.keys(apiPayload).length === 0) {
        // toastError("No changes to save."); // Or some user feedback
        setIsEditDialogOpen(false);
        return;
    }

    updateIdeaMutation.mutate(
      { ideaId: idea.id, data: apiPayload }, // Pass the correctly typed API payload
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          // Invalidation is handled by useUpdateIdea hook's onSuccess
        },
        // onError: (err) => { /* handle update error */ }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-4" />
        <div className="flex space-x-2 mb-4">
          <Skeleton className="h-6 w-20" /> <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-10 w-32 mb-6" />
        <hr />
        <Skeleton className="h-8 w-1/3 mt-6 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (isError || !idea) {
    return (
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <Alert variant="destructive">
          <Zap className="h-4 w-4" />
          <AlertTitle>Error Loading Idea</AlertTitle>
          <AlertDescription>
            {error?.message || "The idea could not be found or loaded."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild className="mt-6">
          <Link href="/app/ideas"> {/* Or just /ideas */}
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Ideas
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="mb-6 -ml-3 text-muted-foreground hover:text-primary"
      >
        <Link href="/app/ideas"> {/* Or just /ideas */}
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to All Ideas
        </Link>
      </Button>

      <article className="space-y-6">
        <header className="space-y-2 relative"> {/* Added relative for positioning edit/delete */}
           {canModify && (
            <div className="absolute top-0 right-0 flex space-x-2">
              <Dialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8"> {/* Smaller icon button */}
                    <Edit3 className="h-4 w-4" />
                    <span className="sr-only">Edit Idea</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Idea</DialogTitle>
                    <DialogDescription>
                      Make changes to your idea details.
                    </DialogDescription>
                  </DialogHeader>
                  <IdeaForm
                    existingIdea={idea}
                    onSubmissionComplete={handleEditSubmit} // This now expects Partial<IdeaUnifiedFormData>
                    isEditing={true}
                  />
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-8 w-8"> {/* Smaller icon button */}
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Idea</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this idea and all related votes and comments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteIdeaMutation.isPending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleteIdeaMutation.isPending}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      {deleteIdeaMutation.isPending
                        ? "Deleting..."
                        : "Yes, delete idea"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {/* Categories should be displayed. Uncomment if data is available */}
          {idea.category && idea.category.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pt-1"> {/* Added pt-1 if edit/delete buttons are present */}
              {idea.category.map((cat: string) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-7 w-7 text-yellow-500" /> {idea.title}
          </h1>
          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={idea.submittedBy?.image || undefined}
                  alt={idea.submittedBy?.name || "User"}
                />
                <AvatarFallback>
                  {getInitials(idea.submittedBy?.name)}
                </AvatarFallback>
              </Avatar>
              <span>{idea.submittedBy?.name || "Anonymous"}</span>
            </div>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {formatDistanceToNow(new Date(idea.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </header>

        <BackgroundGradient
          className="rounded-[22px] p-0.5 bg-white dark:bg-zinc-900"
          animate={false}
        >
          <div className="p-6 bg-card rounded-[20px]">
            <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">
              {idea.description}
            </p>
          </div>
        </BackgroundGradient>

        <div className="flex items-center justify-between pt-2 pb-4 border-b border-t">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleVote}
              disabled={voteMutation.isPending || !currentUser}
              variant={idea.currentUserVoted ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex items-center gap-1.5 transition-all",
                idea.currentUserVoted && "bg-primary text-primary-foreground"
              )}
            >
              <ThumbsUp
                className={cn(
                  "h-4 w-4",
                  idea.currentUserVoted && "fill-current"
                )}
              />
              <span>
                {idea.voteCount} Vote{idea.voteCount !== 1 ? "s" : ""}
              </span>
            </Button>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <MessageSquare className="h-4 w-4" />
              <span>
                {idea.commentCount ?? 0} Comment{(idea.commentCount ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Join the Discussion</h2>
        <IdeaCommentForm ideaId={idea.id} />
        <IdeaCommentList ideaId={idea.id} />
      </section>
    </div>
  );
}