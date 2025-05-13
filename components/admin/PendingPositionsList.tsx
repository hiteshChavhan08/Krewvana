// components/admin/PendingPositionsList.tsx
"use client";

import React, { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Check, X as IconX, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils/helpers"; // Adjust path
import { toast } from "sonner";
import { type PendingVerificationUser } from "@/services/adminService"; // Adjust path

// Type Definitions specific to this component's API interaction
type ApiPagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};
type PendingUsersResponse = {
  data: PendingVerificationUser[];
  pagination: ApiPagination;
};

// --- API Fetch/Mutate Functions ---
async function fetchPendingUsers(
  page: number = 1,
  limit: number = 10
): Promise<PendingUsersResponse> {
  const response = await fetch(
    `/api/admin/users/pending-positions?page=${page}&limit=${limit}`
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch pending users");
  }
  return response.json();
}

async function verifyPosition(
  userId: string,
  isVerified: boolean
): Promise<any> {
  const response = await fetch(`/api/admin/users/${userId}/verify-position`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isVerified }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Failed to update verification status"
    );
  }
  return response.json();
}

export function PendingPositionsList() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: response,
    isLoading,
    isError,
    error,
    isFetching,
    isPlaceholderData,
  } = useQuery<PendingUsersResponse>({
    queryKey: ["pendingVerificationUsers", currentPage, itemsPerPage],
    queryFn: () => fetchPendingUsers(currentPage, itemsPerPage),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60, // Refetch every minute or on invalidation
  });

  const mutation = useMutation({
    mutationFn: ({
      userId,
      isVerified,
    }: {
      userId: string;
      isVerified: boolean;
    }) => verifyPosition(userId, isVerified),
    onSuccess: (data, variables) => {
      toast.success(`User position status updated.`);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({
        queryKey: ["pendingVerificationUsers", currentPage, itemsPerPage],
      });
      queryClient.invalidateQueries({
        queryKey: ["userProfile", variables.userId],
      }); // Update specific user profile cache
    },
    onError: (error: Error, variables) => {
      toast.error(`Failed to update status`, { description: error.message });
    },
  });

  const handleVerify = (userId: string, verify: boolean) => {
    if (mutation.isPending && mutation.variables?.userId === userId) return;
    mutation.mutate({ userId, isVerified: verify });
  };

  // Render Logic
  const users = response?.data ?? [];
  const pagination = response?.pagination;
  const showInitialLoading = isLoading && !isPlaceholderData;

  return (
    <div>
      {isError && (
        <Alert variant="destructive" className="mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Could not load data."}
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg overflow-x-auto">
        {" "}
        {/* Allow horizontal scroll on small screens */}
        <Table>
          {pagination && pagination.totalCount > 0 && (
            <TableCaption>
              Showing page {pagination.page} of {pagination.totalPages} (
              {pagination.totalCount} total pending).
            </TableCaption>
          )}
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Selected Position</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
              {/* Fixed width for actions */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {showInitialLoading &&
              [...Array(3)].map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell>
                    <Skeleton className="h-9 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {!showInitialLoading && !isError && users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center h-24 text-muted-foreground"
                >
                  No users pending position verification.
                </TableCell>
              </TableRow>
            )}
            {!showInitialLoading &&
              !isError &&
              users.map((user: PendingVerificationUser) => {
                const isMutatingCurrentUser =
                  mutation.isPending && mutation.variables?.userId === user.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.name || "Unnamed"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.position?.name ?? (
                        <span className="italic text-muted-foreground">
                          N/A
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isMutatingCurrentUser ? (
                        <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon" // Use icon size
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8" // Adjust size/padding
                            onClick={() => handleVerify(user.id, false)}
                            disabled={mutation.isPending}
                            aria-label={`Reject position for ${user.name}`}
                            title="Reject" // Add tooltip text
                          >
                            {" "}
                            <IconX className="h-4 w-4" />{" "}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon" // Use icon size
                            className="text-green-600 hover:bg-green-500/10 hover:text-green-700 h-8 w-8" // Adjust size/padding
                            onClick={() => handleVerify(user.id, true)}
                            disabled={mutation.isPending}
                            aria-label={`Approve position for ${user.name}`}
                            title="Approve" // Add tooltip text
                          >
                            {" "}
                            <Check className="h-4 w-4" />{" "}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isFetching}
          >
            {" "}
            Previous{" "}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= pagination.totalPages || isFetching}
          >
            {" "}
            Next{" "}
          </Button>
        </div>
      )}
    </div>
  );
}
