// components/admin/DeleteCategoryDialog.tsx
"use client";

import React from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  onConfirmDelete: () => Promise<void>; // Async delete handler
  isDeleting: boolean;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  categoryName,
  onConfirmDelete,
  isDeleting,
}: DeleteCategoryDialogProps) {

  const handleDelete = async () => {
      await onConfirmDelete();
      // Closing the dialog might happen in parent on mutation success
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
             <strong className="mx-1">{categoryName}</strong>
             category and remove its links from any existing Kudos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
             onClick={handleDelete}
             disabled={isDeleting}
             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
           >
             {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Category
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}