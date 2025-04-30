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
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KudosCreateSchema, KudosCreateData } from "@/lib/schemas"; // Adjust path if needed
import { z, ZodError } from "zod";
import { UserSearchSelect } from "@/components/search/UserSearchSelect"; // Adjust path
import { SimpleUser } from "@/types/types"; // Adjust path
import { Loader2 } from "lucide-react";

// API Call Function (Keep outside component)
async function createKudos(data: KudosCreateData): Promise<any> { // Define return type more specifically if possible
  const response = await fetch("/api/kudos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  // Improved error handling
  if (!response.ok) {
    let errorMsg = "Failed to create Kudos.";
    try {
        const errorData = await response.json();
        // Prioritize specific error messages from the backend if available
        errorMsg = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    } catch (e) {
        errorMsg = response.statusText || errorMsg;
    }
     // Throwing allows useMutation's onError to catch it directly
     throw new Error(errorMsg);
  }
  return response.json();
}

// Define props to accept a custom trigger element
interface GiveKudosDialogProps {
    trigger?: React.ReactNode; // Optional: Custom trigger element
}

// Main Component
export function GiveKudosDialog({ trigger }: GiveKudosDialogProps) { // Destructure props
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState<SimpleUser | null>(null);
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({}); // State for Zod errors

  // --- Mutation Hook (Remains the same) ---
  const mutation = useMutation({
    mutationFn: createKudos,
    onSuccess: (data) => {
      toast.success("Kudos Sent!", {
        description: `You gave Kudos to ${data?.receiver?.name ?? 'the user'}.`,
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["kudosFeed"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      // Optionally invalidate receiver's user data
      if (data?.receiver?.id) {
        queryClient.invalidateQueries({ queryKey: ["userProfile", data.receiver.id] }); // Example key
      }
      queryClient.invalidateQueries({ queryKey: ["dashboardUser", session?.user?.id] }); // Invalidate self data

      setOpen(false); // Close dialog
      // State reset handled by useEffect
    },
    onError: (error: Error) => {
      toast.error("Failed to Send Kudos", {
        description: error.message || "An unexpected error occurred.",
      });
    },
  });

  // --- Form Submission Handler ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors

    if (!session?.user?.id) {
      toast.error("Authentication Error", { description: "Please log in again." });
      return;
    }

    // --- Zod Validation ---
    const result = KudosCreateSchema.safeParse({
        receiverId: selectedReceiver?.id, // Use optional chaining
        message: message // Zod schema should handle trimming if needed
    });

    if (!result.success) {
        const fieldErrors: Record<string, string | undefined> = {};
        result.error.errors.forEach(err => {
            if (err.path[0]) { // Ensure path exists
                 fieldErrors[err.path[0]] = err.message;
            }
        });
        setFormErrors(fieldErrors);
        toast.error("Validation Error", { description: "Please check the highlighted fields." });
        console.error("Form Validation Errors:", result.error.flatten());
        return;
    }

    // --- Call Mutation ---
    // result.data contains validated and potentially transformed data
    mutation.mutate(result.data);
  };

  // --- Effect to reset state when dialog closes ---
  useEffect(() => {
    if (!open) {
      setMessage("");
      setSelectedReceiver(null);
      setFormErrors({}); // Clear validation errors
      mutation.reset(); // Reset mutation state (important!)
    }
  }, [open, mutation.reset]); // Add mutation.reset to dependencies

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Render custom trigger if provided, otherwise default button */}
        {trigger ? trigger : (
             <Button variant="default" size="sm"> {/* Adjusted default size */}
                Give Kudos
             </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Give Kudos</DialogTitle>
          <DialogDescription>
            Recognize a colleague for their awesome work!
          </DialogDescription>
        </DialogHeader>
        {/* Use form tag and onSubmit */}
        <form onSubmit={handleSubmit} noValidate> {/* Add noValidate to prevent default HTML5 validation */}
          <div className="grid gap-4 py-4">
            {/* Receiver Selection */}
            <div className="space-y-1.5"> {/* Simpler structure if label on top */}
              <Label htmlFor="receiver-search">To <span className="text-destructive">*</span></Label>
              <UserSearchSelect
                 // id="receiver-search" // Pass ID if UserSearchSelect supports it
                 selectedUser={selectedReceiver}
                 onUserSelect={setSelectedReceiver}
                 placeholder="Search colleague..."
                 excludeUserId={session?.user?.id}
                 aria-invalid={!!formErrors.receiverId} // Link aria-invalid to error state
                 aria-describedby="receiver-error" // Link to error message
              />
              {formErrors.receiverId && (
                <p id="receiver-error" className="text-xs text-destructive mt-1">{formErrors.receiverId}</p>
              )}
            </div>
            {/* Message Input */}
             <div className="space-y-1.5">
              <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
              <Textarea
                id="message"
                placeholder="Tell them why they rock..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-y" // Allow vertical resize
                maxLength={KudosCreateSchema.shape.message._def.checks.find(c => c.kind === 'max')?.value} // Get max length from schema
                aria-invalid={!!formErrors.message} // Link aria-invalid to error state
                aria-describedby="message-error" // Link to error message
              />
               {formErrors.message && (
                <p id="message-error" className="text-xs text-destructive mt-1">{formErrors.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm"> {/* Consistent button size */}
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending} // Only disable while submitting
              size="sm" // Consistent button size
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Send Kudos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}