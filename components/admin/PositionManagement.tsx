// components/admin/PositionManagement.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Position } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Optional for description
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Loader2, PlusCircle } from "lucide-react";
import { CreatePositionSchema } from "@/services/adminService"; // Import schema

// Type inferred from schema
type PositionFormValues = z.infer<typeof CreatePositionSchema>;

// --- API Functions ---
async function fetchAllPositions(): Promise<Position[]> {
  const res = await fetch("/api/admin/positions");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch positions");
  }
  // Assuming API returns the array directly now
  return res.json();
}

async function createNewPosition(data: PositionFormValues): Promise<Position> {
  const res = await fetch("/api/admin/positions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create position");
  }
  return res.json();
}

// --- Component ---
export function PositionManagement() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  // Query to fetch existing positions
  const {
    data: positions = [],
    isLoading,
    isError,
    error,
  } = useQuery<Position[]>({
    queryKey: ["allPositionsAdmin"],
    queryFn: fetchAllPositions,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  // Form hook for adding new positions
  const form = useForm<PositionFormValues>({
    resolver: zodResolver(CreatePositionSchema),
    defaultValues: { name: "", description: "" },
  });

  // Mutation hook for creating positions
  const mutation = useMutation({
    mutationFn: createNewPosition,
    onSuccess: (newPosition) => {
      toast.success(`Position "${newPosition.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["allPositionsAdmin"] }); // Refetch the list
      queryClient.invalidateQueries({ queryKey: ["positions"] }); // Invalidate public list cache too
      form.reset(); // Clear the form
      setShowAddForm(false); // Hide form on success
    },
    onError: (error: Error) => {
      toast.error("Failed to create position", { description: error.message });
    },
  });

  const onSubmit = (values: PositionFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      {/* Section to Add New Position */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Add New Position</CardTitle>
              <CardDescription>
                Create a new job title available for selection.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? (
                "Cancel"
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add New
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Software Engineer II"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe the role..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Position
                </Button>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>

      {/* Section to List Existing Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Positions</CardTitle>
          <CardDescription>
            List of currently available positions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Could not load positions."}
              </AlertDescription>
            </Alert>
          )}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  {/* Add Actions column later if needed (Edit/Delete) */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  [...Array(3)].map((_, i) => (
                    <TableRow key={`skel-pos-${i}`}>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading && !isError && positions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center h-20 text-muted-foreground"
                    >
                      No positions created yet.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  !isError &&
                  positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-medium">{pos.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pos.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
