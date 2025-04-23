// components/kudos/GiveKudosDialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KudosCreateSchema, KudosCreateData } from "@/lib/schemas";
import { User } from "@prisma/client"; // Assuming User type from Prisma
import { ZodError } from "zod";
import { Input } from "../ui/input";

// --- Mock API call function (replace with actual fetch later) ---
// async function fetchUsers(query: string): Promise<User[]> {
//   // Replace with: const res = await fetch(`/api/users?search=${query}`);
//   console.log("Fetching users with query:", query);
//   // Mock response for now
//   return [
//     { id: 'clerk_user_1', name: 'Test User One', email: 'test1@example.com', image: null, points: 0, passwordHash: null, emailVerified: null, createdAt: new Date(), updatedAt: new Date() },
//     { id: 'clerk_user_2', name: 'Test User Two', email: 'test2@example.com', image: null, points: 0, passwordHash: null, emailVerified: null, createdAt: new Date(), updatedAt: new Date() },
//   ].filter(u => u.name?.toLowerCase().includes(query.toLowerCase()));
// }

// --- Actual API Call ---
async function createKudos(data: KudosCreateData): Promise<any> {
  const response = await fetch("/api/kudos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    // More specific error handling based on status code
    if (response.status === 403)
      throw new Error(errorData.error || "Forbidden action.");
    if (response.status === 404)
      throw new Error(errorData.error || "Receiver not found.");
    throw new Error(errorData.error || "Failed to create Kudos.");
  }
  return response.json();
}

export function GiveKudosDialog() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [receiverId, setReceiverId] = useState(""); // TODO: Replace with user selection component
  const [message, setMessage] = useState("");
  const [receiverName, setReceiverName] = useState(""); // For display confirmation
  const queryClient = useQueryClient();

  // --- TODO: Replace basic input with User Search Component ---
  // For now, using a simple input for receiver ID
  const handleReceiverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceiverId(e.target.value);
    // In a real component, you'd set the name here too
    setReceiverName(`User ID: ${e.target.value}`);
  };

  const mutation = useMutation({
    mutationFn: createKudos,
    onSuccess: (data) => {
      toast.success("Kudos Sent!", {
        description: `You gave Kudos to ${data.receiver.name || "user"}.`,
      });
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["kudosFeed"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] }); // If leaderboard exists
      queryClient.invalidateQueries({
        queryKey: ["userData", session?.user?.id],
      }); // Invalidate self data
      setOpen(false); // Close dialog on success
      setMessage("");
      setReceiverId("");
      setReceiverName("");
    },
    onError: (error: Error) => {
      toast.error("Failed to Send Kudos", {
        description: error.message || "An unexpected error occurred.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Authentication Error", {
        description: "Please log in again.",
      });
      return;
    }
    // Basic validation check before Zod
    if (!receiverId || !message) {
      toast.warning("Missing Information", {
        description: "Please select a receiver and write a message.",
      });
      return;
    }

    try {
      // Validate with Zod before submitting
      const validatedData = KudosCreateSchema.parse({ receiverId, message });
      mutation.mutate(validatedData);
    } catch (error: any) {
      if (error instanceof ZodError) {
        // Show validation errors (e.g., first error)
        toast.error("Validation Error", {
          description: error.errors[0].message,
        });
      } else {
        toast.error("Validation Error", {
          description: "Invalid data provided.",
        });
      }
      console.error("Zod Validation Error:", error);
    }
  };

  // Reset form when dialog is closed
  // Reset form when dialog is closed
  useEffect(() => {
    // This logic should only run when the dialog transitions to the closed state
    if (!open) {
      console.log("Dialog closed, resetting form state."); // Add temporary log
      setMessage("");
      setReceiverId("");
      setReceiverName("");
      // It's safe to call mutation.reset() here as its reference is stable
      mutation.reset();
    }
  }, [open]); // <-- CORRECTED DEPENDENCY ARRAY

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
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receiver" className="text-right">
                To
              </Label>
              {/* --- TODO: Replace this Input with a User Search Component --- */}
              <Input
                id="receiver"
                placeholder="Enter Receiver User ID" // Temporary placeholder
                value={receiverId}
                onChange={handleReceiverChange} // Temporary handler
                className="col-span-3"
                required
              />
              {/* --- End Placeholder Input --- */}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Tell them why they rock..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="col-span-3 min-h-[100px]"
                required
                maxLength={500} // Match schema validation
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Sending..." : "Send Kudos"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
