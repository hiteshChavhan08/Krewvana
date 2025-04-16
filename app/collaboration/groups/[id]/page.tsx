// app/collaboration/groups/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MessageSquare, MoreHorizontal, Share, Users, Loader2 ,Terminal} from "lucide-react"; // Added Loader2
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Alert,AlertTitle,AlertDescription} from "@/components/ui/alert"

// --- Define Types based on API responses ---
type GroupDetail = {
    id: string;
    name: string;
    description: string | null;
    type: string; // Consider 'INTEREST' | 'PROJECT' | 'TEAM'
    isPublic: boolean;
    createdAt: string; // Assuming API returns ISO string date
    isJoined: boolean; // Added by the GET /api/groups/[id] endpoint
    image?: string | null; // Optional image
    _count: {
        members: number;
        posts: number;
    };
};

type PostAuthor = {
    id: string;
    name: string | null;
    image: string | null;
};

type Post = {
    id: string;
    title: string | null;
    content: string;
    isAnnouncement: boolean;
    createdAt: string; // Assuming API returns ISO string date
    author: PostAuthor;
    _count: {
        comments: number;
    };
};

type PostApiResponse = { // Type for the posts list endpoint response
    data: Post[];
    pagination: { /* ... pagination details ... */ };
}

// --- End Types ---


export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string; // Get groupId once

  // State variables with types
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isJoined, setIsJoined] = useState<boolean | null>(null); // Start as null to differentiate from false
  const [newPost, setNewPost] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isJoiningOrLeaving, setIsJoiningOrLeaving] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorGroup, setErrorGroup] = useState<string | null>(null);
  const [errorPosts, setErrorPosts] = useState<string | null>(null);

  // --- Data Fetching Callbacks ---
  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;
    setLoadingGroup(true);
    setErrorGroup(null);
    try {
      // --- Corrected Endpoint ---
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
         const errorData = await res.json().catch(() => ({})); // Try to get error message
         throw new Error(errorData.message || `Failed to fetch group data (Status: ${res.status})`);
      }
      const data: GroupDetail = await res.json();
      setGroup(data);
      setIsJoined(data.isJoined ?? false); // Set initial join status from fetched data
    } catch (error: any) {
      console.error("Fetch Group Data Error:", error);
      setErrorGroup(error.message || "Failed to load group details.");
      // Optional: Redirect if group fetch fundamentally fails (e.g., 404)
      // if (error.message.includes('404') || error.message.includes('not found')) {
      //    toast.error("Group not found.");
      //    router.push("/collaboration");
      // }
    } finally {
      setLoadingGroup(false);
    }
  }, [groupId]); // Depend only on groupId

  const fetchGroupPosts = useCallback(async () => {
    if (!groupId) return;
    setLoadingPosts(true);
    setErrorPosts(null);
    try {
      // Fetch posts (assuming pagination might be added later)
      const res = await fetch(`/api/groups/${groupId}/posts?limit=50`); // Fetch more posts initially
      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to fetch posts (Status: ${res.status})`);
      }
      const data: PostApiResponse = await res.json(); // Expect { data: [], pagination: {} }
       if (!Array.isArray(data?.data)) {
           throw new Error("Invalid post data received from server.");
       }
      setPosts(data.data);
    } catch (error: any) {
      console.error("Fetch Posts Error:", error);
      setErrorPosts(error.message || "Failed to load posts.");
    } finally {
      setLoadingPosts(false);
    }
  }, [groupId]); // Depend only on groupId

  // --- Initial Data Fetch Effect ---
  useEffect(() => {
    fetchGroupData();
    fetchGroupPosts();
  }, [fetchGroupData, fetchGroupPosts]); // Use the memoized functions as dependencies

  // --- Action Handlers ---
  const handleJoinLeave = async () => {
    if (!group || isJoiningOrLeaving) return; // Prevent action if no group or already processing

    setIsJoiningOrLeaving(true);
    const wasJoined = isJoined; // Store current state before API call
    const endpoint = wasJoined ? `/api/groups/${groupId}/leave` : `/api/groups/${groupId}/join`;
    // --- These API endpoints (/join, /leave) NEED TO BE CREATED ---

    try {
        console.log(`Attempting to ${wasJoined ? 'leave' : 'join'} group: ${groupId}`);
        // ** MOCK API CALL - REPLACE WITH ACTUAL FETCH **
        await new Promise(resolve => setTimeout(resolve, 700));
        // const res = await fetch(endpoint, { method: 'POST' }); // Use POST or DELETE as appropriate
        // if (!res.ok) {
        //     const errorData = await res.json().catch(() => ({}));
        //     throw new Error(errorData.message || `Failed to ${wasJoined ? 'leave' : 'join'}`);
        // }
        // ** END MOCK API CALL **

        // --- Update state on SUCCESS ---
        const newJoinedState = !wasJoined;
        setIsJoined(newJoinedState);
        toast.success(newJoinedState ? `Successfully joined ${group.name}` : `Successfully left ${group.name}`);

        // Optimistically update member count (or refetch group data)
        setGroup(prevGroup => prevGroup ? ({
             ...prevGroup,
             _count: {
                 ...prevGroup._count,
                 members: prevGroup._count.members + (newJoinedState ? 1 : -1)
             }
        }) : null);

    } catch (error: any) {
      console.error(`Error ${wasJoined ? 'leaving' : 'joining'} group:`, error);
      toast.error(error.message || `Failed to ${wasJoined ? 'leave' : 'join'}. Please try again.`);
      // Optional: Revert optimistic UI update if API call failed
      // setIsJoined(wasJoined);
    } finally {
      setIsJoiningOrLeaving(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !group) return;

    setIsSubmittingPost(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPost }),
      });

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to publish post (Status: ${res.status})`);
      }

      const createdPost: Post = await res.json(); // Expect the created post back

      // Add to the beginning of the posts list
      setPosts(prevPosts => [createdPost, ...prevPosts]);
      setNewPost(""); // Clear textarea
      toast.success("Your post has been published");

    } catch (error: any) {
      console.error("Submit Post Error:", error);
      toast.error(error.message || "Failed to publish post. Please try again.");
    } finally {
      setIsSubmittingPost(false);
    }
  };


  // --- Render Logic ---

  // Loading state for the main group details
  if (loadingGroup) {
    return (
      <div className="container py-8 animate-pulse">
         {/* Back button skeleton */}
         <Skeleton className="h-8 w-32 mb-4" />
         {/* Header card skeleton */}
         <Card className="mb-6">
             <CardHeader className="pb-2"><Skeleton className="h-24 w-full" /></CardHeader>
             <CardContent><Skeleton className="h-6 w-3/4" /></CardContent>
         </Card>
         {/* Tabs skeleton */}
         <Skeleton className="h-10 w-48 mb-4" />
         {/* Post area skeleton */}
         <Card><CardContent className="pt-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    );
  }

  // Error state if group failed to load
  if (errorGroup || !group) {
      return (
          <div className="container py-8 text-center">
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-4 mr-auto" // Align left
                    onClick={() => router.push("/collaboration")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Groups
                </Button>
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Group</h2>
                    <p className="text-muted-foreground">{errorGroup || "Could not load group details."}</p>
                </div>
          </div>
      );
  }


  // Main Render (Group loaded successfully)
  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/collaboration")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Groups
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Group Header Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4 flex-grow min-w-0">
                <Avatar className="h-16 w-16 flex-shrink-0">
                   {/* Safe access to optional image */}
                  <AvatarImage src={group.image ?? undefined} alt={group.name} />
                  <AvatarFallback>{group.name?.substring(0, 2).toUpperCase() ?? 'Gr'}</AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"> {/* Allow wrap */}
                    <CardTitle className="text-2xl break-words">{group.name}</CardTitle> {/* Allow break */}
                     <Badge variant="outline" className="flex-shrink-0">{group.type}</Badge>
                  </div>
                   {/* Safe access to counts and date */}
                  <CardDescription className="mt-1">
                     {group._count?.members ?? 0} members · Created {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}
                  </CardDescription>
                </div>
              </div>
              {/* Show Join/Leave only when status is known */}
              {isJoined !== null && (
                 <Button
                    variant={isJoined ? "outline" : "default"}
                    onClick={handleJoinLeave}
                    disabled={isJoiningOrLeaving}
                    className="flex-shrink-0 mt-2 sm:mt-0" // Adjust margin
                 >
                    {isJoiningOrLeaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isJoiningOrLeaving ? (isJoined ? 'Leaving...' : 'Joining...') : (isJoined ? 'Leave Group' : 'Join Group')}
                 </Button>
              )}
            </div>
          </CardHeader>
           {/* Safe access to description */}
          <CardContent>
            <p className="text-sm">{group.description || "No description provided."}</p>
          </CardContent>
        </Card>

        {/* Tabs for Posts, Members, Events */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts ({group._count?.posts ?? 0})</TabsTrigger>
            <TabsTrigger value="members">Members ({group._count?.members ?? 0})</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger> {/* Add count if available */}
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            {/* Show Post form only if joined */}
            {isJoined && (
              <Card>
                <form onSubmit={handleSubmitPost}>
                  <CardContent className="pt-4">
                    <Textarea
                      placeholder="Share something with the group..."
                      className="min-h-[100px] resize-none"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      disabled={isSubmittingPost}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end border-t pt-4">
                    <Button type="submit" disabled={isSubmittingPost}>
                      {isSubmittingPost && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmittingPost ? "Posting..." : "Post"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}
             {!isJoined && !group.isPublic && ( // Message if private and not joined
                <Card className="text-center py-6">
                    <CardDescription>You must join this private group to post or view content.</CardDescription>
                </Card>
             )}

            {/* Posts List */}
            {loadingPosts && (
                 <div className="space-y-4">
                     <Skeleton className="h-32 w-full rounded-lg" />
                     <Skeleton className="h-32 w-full rounded-lg" />
                 </div>
            )}
            {!loadingPosts && errorPosts && (
                 <Alert variant="destructive">
                     <Terminal className="h-4 w-4" />
                     <AlertTitle>Error Loading Posts</AlertTitle>
                     <AlertDescription>{errorPosts}</AlertDescription>
                 </Alert>
            )}
            {!loadingPosts && !errorPosts && posts.length === 0 && (
                <Card className="text-center py-6">
                     <CardDescription>No posts in this group yet.</CardDescription>
                     {isJoined && <CardDescription className="mt-1">Why not start the conversation?</CardDescription> }
                 </Card>
            )}
             {!loadingPosts && !errorPosts && posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.author?.image ?? undefined} />
                        <AvatarFallback>{post.author?.name?.slice(0, 2).toUpperCase() ?? 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{post.author?.name ?? 'Unknown User'}</p>
                         {/* Format date safely */}
                        <p className="text-xs text-muted-foreground">{post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}</p>
                      </div>
                    </div>
                    {/* Add post actions dropdown here */}
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </div>
                </CardHeader>
                <CardContent>
                   {/* Render content safely */}
                  <p className="whitespace-pre-wrap">{post.content ?? ''}</p>
                </CardContent>
                 {/* Optional: Add comment count display */}
                 <CardFooter className="flex justify-between text-sm text-muted-foreground border-t pt-3">
                     <span>{post._count?.comments ?? 0} Comments</span>
                     <div className="flex gap-4">
                         <button className="flex items-center gap-1 hover:text-primary"><MessageSquare className="h-4 w-4" /> Comment</button>
                         <button className="flex items-center gap-1 hover:text-primary"><Share className="h-4 w-4" /> Share</button>
                     </div>
                 </CardFooter>
              </Card>
            ))}
          </TabsContent>

          {/* Members Tab Content (Placeholder) */}
          <TabsContent value="members">
            <Card><CardContent className="pt-6"><p>Members list coming soon...</p></CardContent></Card>
          </TabsContent>

          {/* Events Tab Content (Placeholder) */}
          <TabsContent value="events">
             <Card><CardContent className="pt-6"><p>Group events coming soon...</p></CardContent></Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}