"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Search, X } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

// Mock data for users
const users = [
  {
    id: "1",
    name: "Maria Garcia",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "MG",
    department: "Marketing",
  },
  {
    id: "2",
    name: "Taylor Kim",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "TK",
    department: "Engineering",
  },
  {
    id: "3",
    name: "Casey Morgan",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "CM",
    department: "Product",
  },
  {
    id: "4",
    name: "Jordan Lee",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "JL",
    department: "Design",
  },
  {
    id: "5",
    name: "Alex Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "AJ",
    department: "Sales",
  },
];

// Mock data for badges
const badges = [
  { id: "1", name: "Star Performer", icon: "⭐" },
  { id: "2", name: "Team Player", icon: "🤝" },
  { id: "3", name: "Problem Solver", icon: "💡" },
  { id: "4", name: "Customer Champion", icon: "🏆" },
  { id: "5", name: "Innovation Guru", icon: "🚀" },
];

// Mock data for values
const values = [
  { id: "1", name: "Excellence" },
  { id: "2", name: "Teamwork" },
  { id: "3", name: "Innovation" },
  { id: "4", name: "Customer Focus" },
  { id: "5", name: "Integrity" },
];

export default function GiveRecognitionPage() {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [points, setPoints] = useState(25);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSelectUser = (user: any) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    if (!message.trim()) {
      toast.message("Please enter a recognition message");
      return;
    }

    if (!selectedValue) {
      toast.error("Please select a value");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.message("Success!", {
        description: "Your recognition has been sent",
      });

      router.push("/recognition");
    } catch (error) {
      toast.error("Failed to send recognition. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Give Recognition</CardTitle>
            <CardDescription>
              Appreciate your colleagues for their great work
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span>{user.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedUsers.length > 0
                        ? `${selectedUsers.length} selected`
                        : "Select recipients..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search people..." />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              onSelect={() => handleSelectUser(user)}
                              className="flex items-center gap-2"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={user.avatar || "/placeholder.svg"}
                                  alt={user.name}
                                />
                                <AvatarFallback>{user.initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.department}
                                </span>
                              </div>
                              <Check
                                className={`ml-auto h-4 w-4 ${
                                  selectedUsers.some((u) => u.id === user.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="What would you like to recognize them for?"
                  className="min-h-[100px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Company Value</Label>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <Badge
                      key={value.id}
                      variant={
                        selectedValue === value.id ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedValue(value.id)}
                    >
                      {value.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Points</Label>
                  <span className="text-sm font-medium">{points} points</span>
                </div>
                <Slider
                  value={[points]}
                  min={5}
                  max={100}
                  step={5}
                  onValueChange={(value) => setPoints(value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Badge (Optional)</Label>
                <RadioGroup
                  value={selectedBadge}
                  onValueChange={setSelectedBadge}
                  className="grid grid-cols-2 gap-2"
                >
                  {badges.map((badge) => (
                    <div key={badge.id} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={badge.id}
                        id={`badge-${badge.id}`}
                      />
                      <Label
                        htmlFor={`badge-${badge.id}`}
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <span>{badge.icon}</span> {badge.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public">Make this recognition public</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/recognition")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Recognition"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
