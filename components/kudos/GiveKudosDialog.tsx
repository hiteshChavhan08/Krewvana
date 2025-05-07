// components/kudos/GiveKudosDialog.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"; // Import useQuery
import { toast } from "sonner";
import { KudosCreateSchema, type KudosCreateData } from "@/lib/schemas"; // Use updated schema
import { type KudosData, type KudosCategoryData } from "@/types/kudos"; // Use updated types
import { UserSearchSelect } from "@/components/search/UserSearchSelect";
import { type SimpleUser } from "@/types/types";
import { Loader2, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"; // For scrollable categories
import { Skeleton } from "../ui/skeleton";

// --- API Call Functions ---

// Fetch available categories
async function fetchKudosCategories(): Promise<KudosCategoryData[]> {
  const response = await fetch("/api/kudos/categories"); // Create this API endpoint
  if (!response.ok) {
    throw new Error("Failed to fetch appreciation categories");
  }
  return response.json();
}

// Create Kudos (expects categoryIds array now)
async function createKudos(data: KudosCreateData): Promise<KudosData> {
  console.log("Attempting fetch POST /api/kudos with data:", data);
  const response = await fetch("/api/kudos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), // Send data including categoryIds array
  });
  if (!response.ok) {
    let errorMsg = "Failed to create Kudos.";
    try {
      const errorData = await response.json();
      errorMsg =
        errorData.error ||
        errorData.message ||
        `Request failed with status ${response.status}`;
    } catch (e) {
      /* Ignore */
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

// --- Props ---
interface GiveKudosDialogProps {
  trigger?: React.ReactNode;
}

// --- Component ---
export function GiveKudosDialog({ trigger }: GiveKudosDialogProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState<SimpleUser | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]); // State for category IDs
  const [formErrors, setFormErrors] = useState<
    Record<string, string | undefined>
  >({});

  // --- Query to fetch categories ---
  const {
    data: availableCategories = [],
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery<KudosCategoryData[], Error>({
    queryKey: ["kudosCategories"],
    queryFn: fetchKudosCategories,
    enabled: open, // Only fetch when the dialog is open
    staleTime: 1000 * 60 * 5, // Cache categories for 5 minutes
  });

  // --- Mutation ---
  const mutation = useMutation<KudosData, Error, KudosCreateData>({
    // mutationFn: The async function that performs the mutation (the fetch call)
    mutationFn: createKudos, // Assign the client-side fetch function here

    // onSuccess: Called when the mutationFn promise resolves successfully
    onSuccess: (data) => {
      console.log("Mutation Success:", data); // Log success data
      toast.success("Kudos Sent!", {
        description: `You gave Kudos to ${data?.receiver?.name ?? "the user"}.`,
      });
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["kudosFeed"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] }); // If you have a leaderboard
      queryClient.invalidateQueries({
        queryKey: ["dashboardUser", session?.user?.id],
      }); // User's own data
      if (data?.receiver?.id) {
        queryClient.invalidateQueries({
          queryKey: ["userProfile", data.receiver.id],
        }); // Receiver's data
      }
      setOpen(false); // Close dialog on success
    },

    // onError: Called when the mutationFn promise rejects (throws an error)
    onError: (error) => {
      console.error("Mutation Error:", error); // Log the actual error object
      toast.error("Failed to Send Kudos", {
        // Use the error message from the caught error
        description: error.message || "An unexpected error occurred.",
      });
    },

    // onSettled: Called after onSuccess or onError, regardless of outcome
    // Useful for final cleanup, but resetting state is handled by useEffect on `open` change
    // onSettled: () => {
    //   console.log("Mutation Settled (finished)");
    // }
  });
  // --- Reset State on Close ---
  const resetDialogState = useCallback(() => {
    setMessage("");
    setSelectedReceiver(null);
    setSelectedCategoryIds([]); // Reset selected categories
    setFormErrors({});
    mutation.reset();
  }, [mutation.reset]);

  useEffect(() => {
    if (!open) resetDialogState();
  }, [open, resetDialogState]);

  // --- Handle Category Selection ---
  const handleCategoryChange = (
    categoryId: string,
    checked: boolean | "indeterminate"
  ) => {
    setSelectedCategoryIds(
      (prev) =>
        checked
          ? [...prev, categoryId] // Add ID if checked
          : prev.filter((id) => id !== categoryId) // Remove ID if unchecked
    );
    // Clear category error when user interacts
    if (formErrors.categoryIds) {
      setFormErrors((prev) => ({ ...prev, categoryIds: undefined }));
    }
  };

  // --- Form Submission ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("--- handleSubmit START ---");
    setFormErrors({});

    if (!session?.user?.id) {
      console.log("Auth check FAILED. User:", session?.user); // <<< ADD LOG
      toast.error("Authentication Error", {
        description: "Please log in again.",
      });
      return; // Exit here
    }
    console.log("Auth check PASSED. User ID:", session.user.id);
    const dataToValidate = {
      receiverId: selectedReceiver?.id,
      message: message,
      categoryIds: selectedCategoryIds,
    };
    console.log("Data before Zod validation:", dataToValidate); // <<< ADD LOG

    // Validate using the updated schema
    const result = KudosCreateSchema.safeParse(dataToValidate);

    if (!result.success) {
      console.error("Zod Validation FAILED:", result.error.flatten());
      const fieldErrors: Record<string, string | undefined> = {};
      result.error.errors.forEach((err) => {
        // Use 'categoryIds' as the key for array errors
        const key = err.path.length > 0 ? String(err.path[0]) : "general";
        fieldErrors[key] = err.message;
      });
      setFormErrors(fieldErrors);
      return; // Prevent submission
    }
    console.log("Zod Validation PASSED. Validated data:", result.data);

    mutation.mutate(result.data);
    console.log("mutation.mutate was called."); // Send validated data (including categoryIds)
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : <Button variant="default">Give Kudos</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        {" "}
        {/* Slightly wider for categories */}
        <DialogHeader>
          <DialogTitle>Give Kudos</DialogTitle>
          <DialogDescription>
            Recognize a colleague for their awesome work!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 py-4">
            {/* Receiver Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="receiverId">
                To <span className="text-destructive">*</span>
              </Label>
              <UserSearchSelect
                // id="receiverId"
                selectedUser={selectedReceiver}
                onUserSelect={setSelectedReceiver}
                placeholder="Search colleague..."
                excludeUserId={session?.user?.id}
                aria-invalid={!!formErrors.receiverId}
                aria-describedby="receiverId-error"
              />
              {formErrors.receiverId && (
                <p
                  id="receiverId-error"
                  className="text-xs text-destructive mt-1"
                >
                  {formErrors.receiverId}
                </p>
              )}
            </div>

            {/* Category Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="categoryIds">
                Appreciation Categories{" "}
                <span className="text-destructive">*</span>
              </Label>
              {isLoadingCategories && (
                <Skeleton className="h-20 w-full rounded-md" />
              )}
              {categoriesError && (
                <div className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle size={14} /> {categoriesError.message}
                </div>
              )}
              {!isLoadingCategories &&
                !categoriesError &&
                availableCategories.length > 0 && (
                  <ScrollArea className="h-32 w-full rounded-md border p-3">
                    {" "}
                    {/* Scrollable area */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {" "}
                      {/* Grid layout */}
                      {availableCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center space-x-2 p-1.5"
                        >
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategoryIds.includes(category.id)}
                            onCheckedChange={(checked) =>
                              handleCategoryChange(category.id, checked)
                            }
                            aria-invalid={!!formErrors.categoryIds}
                            aria-describedby="categoryIds-error"
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              {!isLoadingCategories &&
                !categoriesError &&
                availableCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No categories available.
                  </p>
                )}
              {formErrors.categoryIds && (
                <p
                  id="categoryIds-error"
                  className="text-xs text-destructive mt-1"
                >
                  {formErrors.categoryIds}
                </p>
              )}
            </div>

            {/* Message Input */}
            <div className="space-y-1.5">
              <Label htmlFor="message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Tell them why they rock..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] resize-y"
                maxLength={
                  KudosCreateSchema.shape.message._def.checks.find(
                    (c) => c.kind === "max"
                  )?.value
                }
                aria-invalid={!!formErrors.message}
                aria-describedby="message-error"
              />
              {formErrors.message && (
                <p id="message-error" className="text-xs text-destructive mt-1">
                  {formErrors.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Kudos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
