// components/admin/KudosCategoryManagement.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type KudosAppreciationCategory as Category } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import { CategoryForm } from "./CategoryForm"; // Import the form
import { DeleteCategoryDialog } from "./DeleteCategoryDialog"; // Import delete dialog
import { type CategoryInput } from "@/services/categoryService"; // Import input type

// --- API Client Functions ---
// Wrap fetch calls for better organization

async function fetchAdminKudosCategories(): Promise<Category[]> {
  const res = await fetch("/api/kudos/categories"); // Use the existing GET endpoint
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch categories");
  }
  return res.json();
}

async function createAdminKudosCategory(data: CategoryInput): Promise<Category> {
  const res = await fetch("/api/kudos/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create category");
  }
  return res.json();
}

async function updateAdminKudosCategory({ id, data }: { id: string, data: Partial<CategoryInput> }): Promise<Category> {
  const res = await fetch(`/api/kudos/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update category");
  }
  return res.json();
}

async function deleteAdminKudosCategory(id: string): Promise<void> {
  const res = await fetch(`/api/kudos/categories/${id}`, {
    method: "DELETE",
  });
  // DELETE returns 204 No Content on success, check for non-ok status
  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete category");
  }
  // No body content to return for 204
}


// --- Component ---
export function KudosCategoryManagement() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // --- Data Fetching ---
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery<Category[], Error>({
    queryKey: ["kudosCategoriesAdmin"], // Use a specific key for admin list
    queryFn: fetchAdminKudosCategories,
  });

  // --- Mutations ---
  const createMutation = useMutation<Category, Error, CategoryInput>({
    mutationFn: createAdminKudosCategory,
    onSuccess: (newCategory) => {
      toast.success(`Category "${newCategory.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["kudosCategoriesAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["kudosCategories"] }); // Invalidate public list too
      setIsFormOpen(false); // Close form
    },
    onError: (error) => {
      toast.error("Failed to create category", { description: error.message });
    },
  });

  const updateMutation = useMutation<Category, Error, { id: string, data: Partial<CategoryInput> }>({
    mutationFn: updateAdminKudosCategory,
    onSuccess: (updatedCategory) => {
      toast.success(`Category "${updatedCategory.name}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["kudosCategoriesAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["kudosCategories"] });
      setEditingCategory(null); // Clear editing state
      setIsFormOpen(false);     // Close form
    },
    onError: (error) => {
      toast.error("Failed to update category", { description: error.message });
    },
  });

   const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteAdminKudosCategory,
    onSuccess: () => {
      toast.success(`Category deleted successfully!`);
      queryClient.invalidateQueries({ queryKey: ["kudosCategoriesAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["kudosCategories"] });
      setIsDeleteDialogOpen(false); // Close dialog
      setDeletingCategoryId(null);
    },
    onError: (error) => {
      toast.error("Failed to delete category", { description: error.message });
    },
  });

  // --- Handlers ---
  const handleAddClick = () => {
    setEditingCategory(null); // Ensure not editing
    setIsFormOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (categoryId: string) => {
    setDeletingCategoryId(categoryId);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (values: CategoryInput) => {
    if (editingCategory) {
      // Update existing
      await updateMutation.mutateAsync({ id: editingCategory.id, data: values });
    } else {
      // Create new
      await createMutation.mutateAsync(values);
    }
  };

  const handleConfirmDelete = async () => {
      if (deletingCategoryId) {
          await deleteMutation.mutateAsync(deletingCategoryId);
      }
  }

  const categoryToDelete = categories.find(c => c.id === deletingCategoryId);

  return (
    <div className="space-y-6">
      {/* Form Section (Conditional) */}
      {isFormOpen ? (
          <Card>
             <CardHeader>
                <CardTitle>{editingCategory ? "Edit" : "Add New"} Category</CardTitle>
                <CardDescription>
                  {editingCategory ? "Update the category details." : "Create a new appreciation category."}
                </CardDescription>
             </CardHeader>
             <CardContent>
                 <CategoryForm
                    key={editingCategory?.id ?? 'new'} // Force re-render/reset on edit/add switch
                    initialData={editingCategory}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsFormOpen(false)}
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                 />
             </CardContent>
          </Card>
      ) : (
        // Add Button when form is closed
         <div className="flex justify-end">
            <Button size="sm" onClick={handleAddClick}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add Category
            </Button>
        </div>
      )}

      {/* List Section */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Appreciation Categories</CardTitle>
          <CardDescription>View, edit, or delete Kudos categories.</CardDescription>
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" /> <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error?.message || "Could not load categories."}</AlertDescription>
            </Alert>
          )}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && [...Array(3)].map((_, i) => (
                    <TableRow key={`skel-cat-${i}`}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && !isError && categories.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center h-20 text-muted-foreground">No categories created yet.</TableCell></TableRow>
                )}
                {!isLoading && !isError && categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cat.description || "-"}</TableCell>
                       <TableCell className="text-sm text-muted-foreground font-mono text-xs">{cat.iconName || "-"}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(cat)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                             </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(cat.id)} disabled={deleteMutation.isPending && deletingCategoryId === cat.id}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                             </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
       <DeleteCategoryDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            categoryName={categoryToDelete?.name ?? ''}
            onConfirmDelete={handleConfirmDelete}
            isDeleting={deleteMutation.isPending && deletingCategoryId === categoryToDelete?.id}
        />
    </div>
  );
}