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
import { useMutation, useQueryClient } from "@tanstack/react-query"; // Removed unused useQuery
import { toast } from "sonner";
import { KudosCreateSchema, KudosCreateData } from "@/lib/schemas"; // Assuming schema definition is correct
import { ZodError } from "zod";
import { UserSearchSelect } from "@/components/search/UserSearchSelect"; // Ensure path is correct
import { SimpleUser } from "@/types/types"; // Ensure path is correct
import { Loader2 } from "lucide-react";

// API Call Function (Keep outside component for clarity)
async function createKudos(data: KudosCreateData): Promise<any> {
  const response = await fetch("/api/kudos", { // Ensure this API endpoint exists and works
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  // Improved error handling
  if (!response.ok) {
    let errorMsg = "Failed to create Kudos."; // Default message
    try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    } catch (e) {
        // If response is not JSON, use status text
        errorMsg = response.statusText || errorMsg;
    }
     // Throw specific errors based on status if needed
     if (response.status === 403) throw new Error(errorMsg || "Forbidden action.");
     if (response.status === 404) throw new Error(errorMsg || "Receiver not found.");
     throw new Error(errorMsg);
  }
  return response.json(); // Return parsed JSON on success
}

// Main Component
export function GiveKudosDialog() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState<SimpleUser | null>(null);
  const [message, setMessage] = useState("");

  // Mutation Hook
  const mutation = useMutation({
    mutationFn: createKudos,
    onSuccess: (data) => {
      // Use receiver name from the API response for accuracy
      toast.success("Kudos Sent!", {
        description: `You gave Kudos to ${data?.receiver?.name ?? 'the user'}.`, // Use optional chaining
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["kudosFeed"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      // Optionally invalidate receiver's user data if you have a query for that
      // queryClient.invalidateQueries({ queryKey: ["userData", data?.receiver?.id] });
      queryClient.invalidateQueries({ queryKey: ["userData", session?.user?.id] }); // Invalidate self data (e.g., points)

      setOpen(false); // Close dialog
      // Resetting state is handled by the useEffect below
    },
    onError: (error: Error) => {
      toast.error("Failed to Send Kudos", {
        description: error.message || "An unexpected error occurred.",
      });
    },
  });

  // Form Submission Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Authentication Error", { description: "Please log in again." });
      return;
    }

    // Trim message before validation
    const trimmedMessage = message.trim();

    // Check for receiver and non-empty message
    if (!selectedReceiver?.id || !trimmedMessage) {
      toast.warning("Missing Information", {
        description: "Please select a receiver and write a message.",
      });
      return;
    }

    try {
      // Use selected receiver ID and trimmed message for validation
      const validatedData = KudosCreateSchema.parse({
          receiverId: selectedReceiver.id,
          message: trimmedMessage
        });
      // Call the mutation with validated data
      mutation.mutate(validatedData);
    } catch (error: any) {
      if (error instanceof ZodError) {
        // Extract and show Zod validation errors
        const formattedErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
        toast.error("Validation Error", { description: formattedErrors || error.errors[0]?.message });
      } else {
        // Handle other potential errors during validation
        toast.error("Validation Error", { description: "Invalid data provided." });
      }
      console.error("Form Validation Error:", error);
    }
  };

  // Effect to reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset local state
      setMessage("");
      setSelectedReceiver(null);
      // Reset mutation state (errors, status)
      mutation.reset();
    }
    // Depend only on 'open' state for closing logic.
    // 'mutation' reference is stable, no need to include unless its options change.
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg">
          Give Kudos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Give Kudos</DialogTitle>
          <DialogDescription>
            Recognize a colleague for their awesome work!
          </DialogDescription>
        </DialogHeader>
        {/* Use form tag and onSubmit */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Receiver Selection */}
            <div className="grid grid-cols-4 items-start gap-4"> {/* Use items-start */}
              <Label htmlFor="receiver-search" className="text-right pt-2"> {/* Match ID */}
                To *
              </Label>
              <div className="col-span-3">
                <UserSearchSelect
                   // Give the underlying input a unique ID for the label
                   // (UserSearchSelect internal input should ideally accept an id prop)
                   // For now, we link label to the search component conceptually
                   // id="receiver-search"
                   selectedUser={selectedReceiver}
                   onUserSelect={setSelectedReceiver}
                   placeholder="Search colleague by name or email..."
                   excludeUserId={session?.user?.id} // Exclude logged-in user
                />
                 {/* Consider adding Zod error display here if needed */}
              </div>
            </div>
            {/* Message Input */}
            <div className="grid grid-cols-4 items-start gap-4"> {/* Use items-start */}
              <Label htmlFor="message" className="text-right pt-2">
                Message *
              </Label>
              <Textarea
                id="message"
                placeholder="Tell them why they rock..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="col-span-3 min-h-[100px]"
                required // Keep HTML5 required for basic check
                maxLength={500} // UI limit, Zod handles actual validation
                aria-invalid={mutation.error ? 'true' : 'false'} // Indicate error state based on mutation
              />
               {/* Consider adding Zod error display here */}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending || !selectedReceiver || !message.trim()} // Disable if pending, no receiver, or empty message
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