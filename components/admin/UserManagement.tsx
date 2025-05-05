// components/admin/UserManagement.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type AdminUserListItem } from "@/services/adminService"; // Import type
import { UserRole } from "@prisma/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Loader2, Check, ShieldAlert, UserCog } from "lucide-react";
import { getInitials } from "@/lib/utils/helpers";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useSession } from "next-auth/react"; // To prevent changing own role

// API Functions
type UserListResponse = {
  data: AdminUserListItem[];
  pagination: {
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
  };
};
async function fetchAllUsers(
  page: number = 1,
  limit: number = 10,
  search?: string | null
): Promise<UserListResponse> {
  let url = `/api/admin/users?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}
async function updateUserRoleApi(userId: string, role: UserRole): Promise<any> {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update role");
  }
  return res.json();
}

export function UserManagement() {
  const queryClient = useQueryClient();
  const { data: session } = useSession(); // Get current admin user
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const itemsPerPage = 10;

  const {
    data: response,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<UserListResponse>({
    queryKey: ["allUsersAdmin", currentPage, itemsPerPage, debouncedSearchTerm],
    queryFn: () =>
      fetchAllUsers(currentPage, itemsPerPage, debouncedSearchTerm),
    placeholderData: keepPreviousData,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRoleApi(userId, role),
    onSuccess: (data, variables) => {
      toast.success(`User role updated successfully.`);
      // Invalidate the specific page user was on
      queryClient.invalidateQueries({
        queryKey: [
          "allUsersAdmin",
          currentPage,
          itemsPerPage,
          debouncedSearchTerm,
        ],
      });
      // Invalidate specific user profile if needed
      queryClient.invalidateQueries({
        queryKey: ["userProfile", variables.userId],
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update role", { description: error.message });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === session?.user?.id) {
      toast.error("Action Denied", {
        description: "Admins cannot change their own role here.",
      });
      return;
    }
    roleMutation.mutate({ userId, role: newRole as UserRole });
  };

  const users = response?.data ?? [];
  const pagination = response?.pagination;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          View and manage user roles and details.
        </CardDescription>
        <div className="pt-2">
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isError && <Alert variant="destructive">...</Alert>}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            {pagination && pagination.totalCount > 0 && (
              <TableCaption>
                Showing page {pagination.page} of {pagination.totalPages} (
                {pagination.totalCount} total users).
              </TableCaption>
            )}
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={`skel-usr-${i}`}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && !isError && users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No users found matching criteria.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                !isError &&
                users.map((user) => (
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
                      {user.position?.name ?? "-"}
                      {!user.isPositionVerified && user.position?.name && (
                        <span title="Position pending verification">
                          <ShieldAlert className="h-3 w-3 inline-block ml-1 text-orange-500" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) =>
                          handleRoleChange(user.id, newRole)
                        }
                        disabled={
                          roleMutation.isPending ||
                          user.id === session?.user?.id
                        } // Disable self-change
                      >
                        <SelectTrigger className="h-8 text-xs w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.USER}>User</SelectItem>
                          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {roleMutation.isPending &&
                        roleMutation.variables?.userId === user.id && (
                          <Loader2 className="h-4 w-4 animate-spin inline-block ml-2" />
                        )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.points.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            {" "}
            {/* ... Pagination Buttons ... */}{" "}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Need keepPreviousData for pagination
import { keepPreviousData } from "@tanstack/react-query";import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

