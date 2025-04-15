"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  MoreHorizontal,
  Share,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { useToast } from "@/hooks/use-toast"
import { toast } from "sonner";
import { Description } from "@radix-ui/react-dialog";

// Mock group data
const groupData = {
  "1": {
    id: "1",
    name: "Product Design",
    type: "Interest",
    description:
      "A group for discussing product design principles, tools, and trends. Share your work, get feedback, and learn from others in the field.",
    memberCount: 24,
    isJoined: false,
    image: "/placeholder.svg?height=80&width=80",
    createdAt: "3 months ago",
    members: [
      {
        id: "1",
        name: "Alex Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "AJ",
        role: "Admin",
      },
      {
        id: "2",
        name: "Maria Garcia",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "MG",
        role: "Member",
      },
      {
        id: "3",
        name: "Taylor Kim",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "TK",
        role: "Member",
      },
      {
        id: "4",
        name: "Jordan Lee",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "JL",
        role: "Member",
      },
      {
        id: "5",
        name: "Casey Morgan",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "CM",
        role: "Member",
      },
    ],
    posts: [
      {
        id: "1",
        author: {
          id: "1",
          name: "Alex Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "AJ",
        },
        content:
          "Just shared a new design system documentation in the files section. Would love your feedback!",
        createdAt: "2 days ago",
        likes: 8,
        comments: 3,
      },
      {
        id: "2",
        author: {
          id: "2",
          name: "Maria Garcia",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "MG",
        },
        content:
          "Has anyone tried the new Figma plugins for accessibility? I'm looking for recommendations.",
        createdAt: "1 week ago",
        likes: 5,
        comments: 7,
      },
    ],
    events: [
      {
        id: "1",
        title: "Design Review Session",
        date: "Tomorrow, 2:00 PM",
        location: "Meeting Room 3 / Zoom",
        attendees: 12,
      },
      {
        id: "2",
        title: "UX Workshop",
        date: "Next Tuesday, 10:00 AM",
        location: "Conference Room A",
        attendees: 18,
      },
    ],
  },
  "2": {
    id: "2",
    name: "Frontend Development",
    type: "Interest",
    description:
      "Share knowledge about frontend frameworks, CSS tricks, and web performance. Ask questions, share resources, and collaborate on projects.",
    memberCount: 42,
    isJoined: true,
    image: "/placeholder.svg?height=80&width=80",
    createdAt: "1 year ago",
    members: [
      {
        id: "5",
        name: "Casey Morgan",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "CM",
        role: "Admin",
      },
      {
        id: "2",
        name: "Maria Garcia",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "MG",
        role: "Member",
      },
      {
        id: "3",
        name: "Taylor Kim",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "TK",
        role: "Member",
      },
    ],
    posts: [
      {
        id: "1",
        author: {
          id: "5",
          name: "Casey Morgan",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "CM",
        },
        content:
          "Just published a blog post about React performance optimizations. Check it out and let me know what you think!",
        createdAt: "3 days ago",
        likes: 15,
        comments: 6,
      },
    ],
    events: [
      {
        id: "1",
        title: "JavaScript Meetup",
        date: "This Friday, 5:00 PM",
        location: "Cafeteria / Zoom",
        attendees: 24,
      },
    ],
  },
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  // const { toast } = useToast()
  const [group, setGroup] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // In a real app, this would be an API call
    const groupId = params.id as string;
    const fetchedGroup = groupData[groupId as keyof typeof groupData];

    if (fetchedGroup) {
      setGroup(fetchedGroup);
      setIsJoined(fetchedGroup.isJoined);
    } else {
      // Handle group not found
      router.push("/collaboration");
    }
  }, [params.id, router]);

  const handleJoinLeave = () => {
    // In a real app, this would make an API call
    setIsJoined(!isJoined);

    toast.message(isJoined ? "Left group" : "Joined group", {
      description: isJoined
        ? `You have left the ${group?.name} group`
        : `You have joined the ${group?.name} group`,
    });
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPost.trim()) {
      // toast({
      //   title: "Error",
      //   description: "Please enter a message",
      //   variant: "destructive",
      // })
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state with new post
      const newPostObj = {
        id: `temp-${Date.now()}`,
        author: {
          id: "current-user",
          name: "John Doe",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "JD",
        },
        content: newPost,
        createdAt: "Just now",
        likes: 0,
        comments: 0,
      };

      setGroup({
        ...group,
        posts: [newPostObj, ...group.posts],
      });

      setNewPost("");
      toast.success("Your post has been published");
    } catch (error) {
      toast.error("Failed to publish post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-[60vh]">
          <p>Loading group details...</p>
        </div>
      </div>
    );
  }

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
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={group.image || "/placeholder.svg"}
                    alt={group.name}
                  />
                  <AvatarFallback>{group.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{group.name}</CardTitle>
                    <Badge variant="outline">{group.type}</Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {group.memberCount} members · Created {group.createdAt}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant={isJoined ? "outline" : "default"}
                onClick={handleJoinLeave}
              >
                {isJoined ? "Leave Group" : "Join Group"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{group.description}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {isJoined && (
              <Card>
                <form onSubmit={handleSubmitPost}>
                  <CardContent className="pt-4">
                    <Textarea
                      placeholder="Share something with the group..."
                      className="min-h-[100px] resize-none"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end border-t pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Posting..." : "Post"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            {group.posts.map((post: any, index: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={post.author.avatar || "/placeholder.svg"}
                            alt={post.author.name}
                          />
                          <AvatarFallback>
                            {post.author.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{post.author.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {post.createdAt}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Share className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{post.content}</p>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                    >
                      👍 {post.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                    >
                      <MessageSquare className="mr-1 h-4 w-4" />
                      {post.comments}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}

            {group.posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No posts yet</h3>
                <p className="text-sm text-muted-foreground">
                  Be the first to post in this group
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Members ({group.memberCount})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.members.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={member.avatar || "/placeholder.svg"}
                            alt={member.name}
                          />
                          <AvatarFallback>{member.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          {member.role === "Admin" && (
                            <Badge variant="outline" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Profile
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.events.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.date}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.location}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {event.attendees} attending
                          </span>
                        </div>
                      </div>
                      <Button size="sm">RSVP</Button>
                    </div>
                  ))}

                  {group.events.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">
                        No upcoming events
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Check back later for new events
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
