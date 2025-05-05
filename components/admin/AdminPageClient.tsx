// components/admin/AdminPageClient.tsx
"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingPositionsList } from "./PendingPositionsList"; // Adjust path

export function AdminPageClient() {
  return (
    <Tabs defaultValue="position-verification" className="w-full">
      {/* Use flex-wrap for smaller screens if many tabs are added */}
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        <TabsTrigger value="position-verification">
          Position Verification
        </TabsTrigger>
        <TabsTrigger value="position-management">
          Position Management
        </TabsTrigger>
        <TabsTrigger value="user-management">User Management</TabsTrigger>
        <TabsTrigger value="content-moderation">Content Moderation</TabsTrigger>
        <TabsTrigger value="badge-management">Badge Management</TabsTrigger>
      </TabsList>

      {/* Content for Position Verification Tab */}
      <TabsContent
        value="position-verification"
        className="mt-6 rounded-lg border bg-card text-card-foreground shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold mb-4">
          Pending Position Approvals
        </h2>
        <PendingPositionsList />
      </TabsContent>
      {/* --- Add Content for Position Management --- */}
      <TabsContent value="position-management" className="mt-6">
        <PositionManagement />
      </TabsContent>
      {/* --- End Position Management Content --- */}
      {/* Placeholder Content for Other Tabs */}
      {/* --- Badge Management Content --- */}

      {/* --- End Badge Management Content --- */}

      {/* --- User Management Content --- */}
      <TabsContent value="user-management" className="mt-6">
        <UserManagement />
      </TabsContent>
      {/* --- End User Management Content --- */}
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

// Temporary Card component used in placeholders above
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PositionManagement } from "./PositionManagement";
import { BadgeManagement } from "./BadgeManagement";
import { UserManagement } from "./UserManagement";
