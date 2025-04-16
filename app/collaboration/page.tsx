// / app/collaboration/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Filter, Plus, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel, // Added for filter title
  DropdownMenuSeparator, // Added for filter
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For errors
import { Terminal } from "lucide-react"; // Error icon

// Define the type based on API response + UI needs
type GroupFromAPI = {
  id: string;
  name: string;
  type: string; // Consider using actual enum 'INTEREST' | 'PROJECT' | 'TEAM'
  description: string | null;
  isPublic: boolean;
  _count: {
    members: number;
  };
   // Add image property if returned by API
   image?: string | null;
};

// UI state might include derived/client-side info
type GroupUI = GroupFromAPI & {
    memberCount: number; // Flatten count for easier use
    isJoined: boolean; // This needs separate logic to determine
};

// --- Mock function to determine if user joined ---
// !! Replace this with actual logic using session/membership data !!
const checkMembership = (groupId: string, userMemberships: string[]): boolean => {
    // In a real app, userMemberships would come from session or another API call
    // Example: const { data: session } = useSession(); session.user.groupMemberships...
    return userMemberships.includes(groupId);
};
// --- End Mock function ---

export default function CollaborationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null); // State for filtering
  const [allGroups, setAllGroups] = useState<GroupUI[]>([]); // Stores the raw fetched groups + UI state
  const [filteredGroups, setFilteredGroups] = useState<GroupUI[]>([]); // Stores groups after search/filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State for fetch errors

  // !! Replace with actual user membership data !!
  const [myGroupIds, setMyGroupIds] = useState<string[]>(['mock-group-id-1']); // Example

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        // Construct API URL with potential filters later
        const apiUrl = "/api/groups"; // Add query params like ?type=INTEREST if filtering server-side
        const res = await fetch(apiUrl);

        if (!res.ok) {
          throw new Error(`Failed to fetch groups (status: ${res.status})`);
        }

        const responseData = await res.json(); // Get the object { data: [], pagination: {} }

        // --- FIX: Extract the 'data' array ---
        const groupsFromApi: GroupFromAPI[] = responseData.data;

        if (!Array.isArray(groupsFromApi)) {
             console.error("API response data is not an array:", responseData);
             throw new Error("Received invalid group data from server.");
        }

        // Map API data to UI state, including membership check
         const groupsForUi = groupsFromApi.map(group => ({
             ...group,
             memberCount: group._count.members,
             isJoined: checkMembership(group.id, myGroupIds), // Check membership
         }));

        setAllGroups(groupsForUi);
        setFilteredGroups(groupsForUi); // Initialize filtered list

      } catch (err) {
        console.error("Error fetching groups:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [myGroupIds]); // Re-fetch if user memberships change (though likely needs more complex state management)

  // --- Filtering and Searching Logic ---
  useEffect(() => {
      let result = allGroups;

      // Apply type filter
      if (filterType) {
          result = result.filter(group => group.type.toUpperCase() === filterType.toUpperCase());
      }

      // Apply search query
      if (searchQuery.trim()) {
          const lowerQuery = searchQuery.toLowerCase();
          result = result.filter(
              (group) =>
                  group.name.toLowerCase().includes(lowerQuery) ||
                  (group.description && group.description.toLowerCase().includes(lowerQuery)) || // Check if description exists
                  group.type.toLowerCase().includes(lowerQuery)
          );
      }

      setFilteredGroups(result);

  }, [searchQuery, filterType, allGroups]); // Re-run filter when query, filter, or base data changes


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (type: string | null) => {
     setFilterType(type);
  };


  return (
    <div className="container py-8 px-8">
      <div className="mb-8 flex items-center justify-between">
        {/* Header remains the same */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collaboration</h1>
          <p className="text-muted-foreground">Connect with colleagues and join interest groups</p>
        </div>
        <Button asChild>
          <Link href="/collaboration/groups/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Link>
        </Button>
      </div>

       {/* Filter and Search UI remains the same */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search groups..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange} // Use updated handler
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                Filter {filterType ? `(${filterType})` : ""}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Update filter handlers */}
              <DropdownMenuItem onSelect={() => handleFilterChange(null)}>All Types</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleFilterChange('INTEREST')}>Interest Groups</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleFilterChange('PROJECT')}>Project Groups</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleFilterChange('TEAM')}>Team Groups</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Display Error Message */}
        {error && (
            <Alert variant="destructive" className="mb-6">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error Loading Groups</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}


      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Groups</TabsTrigger>
          <TabsTrigger value="joined">My Groups</TabsTrigger>
        </TabsList>

        {/* "All Groups" Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <GroupSkeleton key={i} />)
              // --- Corrected map call ---
              : filteredGroups.map((group, index) => (
                  <GroupCard key={group.id} group={group} index={index} myGroupIds={myGroupIds} setMyGroupIds={setMyGroupIds}/>
                ))}
          </div>

          {/* No Groups Found Message */}
          {!loading && !error && filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No groups found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterType ? "Try adjusting your search or filters." : "No groups available yet."}
              </p>
            </div>
          )}
        </TabsContent>

        {/* "My Groups" Tab */}
        <TabsContent value="joined" className="space-y-4">
            {loading && ( // Show skeletons while loading this tab too
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => <GroupSkeleton key={`sk-joined-${i}`} />)}
                </div>
            )}
          {!loading && !error && ( // Only render content when not loading and no error
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Filter from the ALREADY filtered list based on join status */}
                {filteredGroups
                    .filter((group) => group.isJoined) // Filter based on state
                    .map((group, index) => (
                    <GroupCard key={group.id} group={group} index={index} myGroupIds={myGroupIds} setMyGroupIds={setMyGroupIds} />
                    ))}
                </div>

                {/* No Joined Groups Message */}
                {filteredGroups.filter((group) => group.isJoined).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">You haven't joined any groups yet</h3>
                    <p className="text-sm text-muted-foreground">Explore the "All Groups" tab to find groups to join.</p>
                    </div>
                )}
              </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Updated GroupCard ---
function GroupCard({
    group,
    index,
    myGroupIds, // Pass membership info down
    setMyGroupIds // Pass setter down to update state on join/leave
}: {
    group: GroupUI;
    index: number;
    myGroupIds: string[];
    setMyGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  // isJoined is now derived directly from props/state, no internal state needed for this
  const isJoined = myGroupIds.includes(group.id);
  const [isUpdating, setIsUpdating] = useState(false); // Loading state for join/leave button

  const handleJoinLeave = async () => {
     setIsUpdating(true);
     // --- TODO: Implement API Call Here ---
     // const endpoint = isJoined ? `/api/groups/${group.id}/leave` : `/api/groups/${group.id}/join`;
     // const method = 'POST'; // or DELETE for leave? Define in API
     console.log(`${isJoined ? 'Leaving' : 'Joining'} group: ${group.id}`);
     try {
        // const res = await fetch(endpoint, { method });
        // if (!res.ok) throw new Error(`Failed to ${isJoined ? 'leave' : 'join'}`);

        // --- Mock update ---
         await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        // --- End Mock update ---

         // Update the parent state (replace mock logic above with actual API call result)
         if (isJoined) {
             // Remove from joined list
             setMyGroupIds(prev => prev.filter(id => id !== group.id));
         } else {
             // Add to joined list
             setMyGroupIds(prev => [...prev, group.id]);
         }

     } catch (error) {
         console.error(`Error ${isJoined ? 'leaving' : 'joining'} group:`, error);
         // TODO: Show error message to user (e.g., using toast)
     } finally {
         setIsUpdating(false);
     }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden flex flex-col h-full"> {/* Ensure card takes full height */}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0"> {/* Prevent avatar shrinking */}
                 {/* Use group.image if available */}
                 <AvatarImage src={group.image || "/placeholder.svg"} alt={group.name} />
                <AvatarFallback>{group.name?.substring(0, 2).toUpperCase() ?? 'Gr'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0"> {/* Allow text to wrap */}
                <CardTitle className="text-lg truncate" title={group.name}>{group.name}</CardTitle> {/* Add truncate and title */}
                <CardDescription>{group.memberCount ?? 0} members</CardDescription> {/* Use memberCount */}
              </div>
            </div>
             <Badge variant="outline" className="flex-shrink-0">{group.type}</Badge> {/* Use group.type */}
          </div>
        </CardHeader>
        <CardContent className="flex-grow"> {/* Allow content to grow */}
          <p className="text-sm line-clamp-2">{group.description ?? "No description available."}</p> {/* Handle null description */}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4 mt-auto"> {/* Push footer down */}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/collaboration/groups/${group.id}`}>View Details</Link>
          </Button>
          <Button variant={isJoined ? "outline" : "default"} size="sm" onClick={handleJoinLeave} disabled={isUpdating}>
            {isUpdating ? (isJoined ? "Leaving..." : "Joining...") : (isJoined ? "Leave" : "Join")}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function GroupSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </CardFooter>
    </Card>
  );
}
