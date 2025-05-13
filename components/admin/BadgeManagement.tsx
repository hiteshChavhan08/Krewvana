// components/admin/BadgeManagement.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Badge } from "@prisma/client"; // Import Badge type
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
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
import {
  Terminal,
  Loader2,
  PlusCircle,
  HelpCircle,
  Palette,
} from "lucide-react";
import { CreateBadgeSchema } from "@/services/adminService"; // Import schema (adjust path if needed)

// Type inferred from schema
type BadgeFormValues = z.infer<typeof CreateBadgeSchema>;

// --- API Functions ---

/** Fetches all badge definitions from the admin API */
async function fetchAllBadges(): Promise<Badge[]> {
  const res = await fetch("/api/admin/badges"); // Use the correct API route
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: "Failed to fetch badges" }));
    throw new Error(errorData.message || "Failed to fetch badges");
  }
  // Assuming API returns the array directly based on respondSuccess(badges)
  const data = await res.json();
  return Array.isArray(data) ? data : []; // Ensure it's an array
}

/** Creates a new badge definition via the admin API */
async function createNewBadge(data: BadgeFormValues): Promise<Badge> {
  const res = await fetch("/api/admin/badges", {
    // Use the correct API route
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: "Failed to create badge" }));
    // Throw error to be caught by mutation's onError
    throw new Error(
      errorData.message || `Failed to create badge (${res.status})`
    );
  }
  return res.json(); // Return the newly created badge data
}

// --- Component ---
export function BadgeManagement() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  // Query to fetch existing badges
  const {
    data: badges = [],
    isLoading,
    isError,
    error,
  } = useQuery<Badge[]>({
    queryKey: ["allBadgesAdmin"],
    queryFn: fetchAllBadges, // Use the fetch function
    staleTime: 1000 * 60 * 10, // Cache for 10 mins
  });

  // Form hook for adding new badges
  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(CreateBadgeSchema),
    defaultValues: {
      name: "",
      description: "",
      iconName: "",
      criteriaDesc: "",
    },
  });

  // Mutation hook for creating badges
  const mutation = useMutation({
    mutationFn: createNewBadge, // Use the create function
    onSuccess: (newBadge) => {
      toast.success(`Badge "${newBadge.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["allBadgesAdmin"] }); // Refetch the list
      form.reset();
      setShowAddForm(false);
    },
    onError: (error: Error) => {
      // Display specific error from API if available
      toast.error("Failed to create badge", { description: error.message });
    },
  });

  const onSubmit = (values: BadgeFormValues) => {
    // Optional: Clean up optional fields before sending if needed
    const payload = {
      ...values,
      iconName: values.iconName || null,
      criteriaDesc: values.criteriaDesc || null,
    };
    mutation.mutate(payload);
  };

  // --- Render Logic --- (Keep the JSX structure from the previous step)
  return (
    <div className="space-y-6">
      {/* Add New Badge Form Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add New Badge</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? (
                "Cancel"
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Badge
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Define a new badge that users can earn.
          </CardDescription>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Form Fields for name, description, iconName, criteriaDesc */}
                {/* Example: */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badge Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="iconName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Lucide Icon Name (e.g., Star)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="criteriaDesc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criteria</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}{" "}
                  Create Badge
                </Button>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>

      {/* List Existing Badges Card */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Badges</CardTitle>
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Could not load badges."}
              </AlertDescription>
            </Alert>
          )}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Criteria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  [...Array(3)].map((_, i) => (
                    <TableRow key={`skel-bdg-${i}`}>
                      <TableCell>
                        <Skeleton className="h-6 w-6 rounded" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading && !isError && badges.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center h-20 text-muted-foreground"
                    >
                      No badges created yet.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  !isError &&
                  badges.map((badge) => (
                    <TableRow key={badge.id}>
                      <TableCell>
                        <BadgeIcon
                          iconName={badge.iconName}
                          className="h-5 w-5 mx-auto text-muted-foreground"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {badge.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {badge.description}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {badge.criteriaDesc || "-"}
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

// --- BadgeIcon Helper --- (Keep this or move to utils)
const BadgeIcon = ({
  iconName,
  className,
}: {
  iconName: string | null;
  className?: string;
}) => {
  try {
    // Ensure lucide-react is available
    const LucideIcon = require("lucide-react")[
      iconName as any
    ] as React.ElementType;
    if (!LucideIcon) return <HelpCircle className={className || "h-4 w-4"} />;
    return <LucideIcon className={className || "h-4 w-4"} />;
  } catch (e) {
    // Handle cases where icon name is invalid or lucide-react is not found
    console.warn(`Could not load Lucide icon: ${iconName}`, e);
    return <HelpCircle className={className || "h-4 w-4"} />;
  }
};
