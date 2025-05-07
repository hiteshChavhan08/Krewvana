// components/admin/AdminPageClient.tsx
"use client";

import React, { useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingPositionsList } from "./PendingPositionsList";
import { PositionManagement } from "./PositionManagement";
import { BadgeManagement } from "./BadgeManagement";
import { UserManagement } from "./UserManagement";
import { KudosCategoryManagement } from "./KudosCategoryManagement"; // Import the new component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { DatabaseZap, Loader2 } from "lucide-react";
import { seedExampleKudosCategories } from "@/lib/actions/adminActions";
import { toast } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";

export function AdminPageClient() {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient(); // Get query client instance

  const handleSeedCategories = () => {
    startTransition(async () => {
      const result = await seedExampleKudosCategories();
      if (result.success) {
        toast.success("Categories Seeded", { description: result.message });
        // Invalidate the query to refetch the list in KudosCategoryManagement
        queryClient.invalidateQueries({ queryKey: ["kudosCategoriesAdmin"] });
        queryClient.invalidateQueries({ queryKey: ["kudosCategories"] }); // Invalidate public one too
      } else {
        toast.error("Seeding Failed", { description: result.message });
      }
    });
  };
  return (
    <Tabs defaultValue="position-verification" className="w-full">
      {/* Update grid columns if needed */}
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <TabsTrigger value="position-verification">
          Position Verification
        </TabsTrigger>
        <TabsTrigger value="position-management">
          Position Management
        </TabsTrigger>
        {/* ++ ADDED Trigger ++ */}
        <TabsTrigger value="kudos-categories">Kudos Categories</TabsTrigger>
        <TabsTrigger value="user-management">User Management</TabsTrigger>
        <TabsTrigger value="content-moderation">Content Moderation</TabsTrigger>
        <TabsTrigger value="badge-management">Badge Management</TabsTrigger>
      </TabsList>

      <TabsContent value="position-verification" className="mt-6">
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>Pending Position Approvals</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <PendingPositionsList />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="position-management" className="mt-6">
        <PositionManagement />
      </TabsContent>
      {/* Add a section above the tabs content, maybe? Or inside the category tab */}
      <div className="mb-6 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeedCategories}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DatabaseZap className="mr-2 h-4 w-4" /> // Seed icon
          )}
          Seed Example Categories
        </Button>
      </div>
      {/* ++ ADDED Content ++ */}
      <TabsContent value="kudos-categories" className="mt-6">
        <KudosCategoryManagement />
      </TabsContent>

      <TabsContent value="user-management" className="mt-6">
        <UserManagement />
      </TabsContent>

      <TabsContent value="content-moderation" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground italic">
              Content moderation features coming soon.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="badge-management" className="mt-6">
        <BadgeManagement />
      </TabsContent>
    </Tabs>
  );
}
