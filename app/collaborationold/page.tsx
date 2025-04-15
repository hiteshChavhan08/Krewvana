"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Filter, Plus, Search, Users } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for groups
const groups = [
  {
    id: "1",
    name: "Product Design",
    type: "Interest",
    description: "A group for discussing product design principles, tools, and trends.",
    memberCount: 24,
    isJoined: false,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "2",
    name: "Frontend Development",
    type: "Interest",
    description: "Share knowledge about frontend frameworks, CSS tricks, and web performance.",
    memberCount: 42,
    isJoined: true,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "3",
    name: "Marketing Strategy",
    type: "Interest",
    description: "Discuss effective marketing strategies, campaign ideas, and analytics.",
    memberCount: 18,
    isJoined: false,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "4",
    name: "Data Science",
    type: "Interest",
    description: "Explore data analysis techniques, machine learning models, and visualization tools.",
    memberCount: 31,
    isJoined: false,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "5",
    name: "Project Alpha",
    type: "Project",
    description: "Collaboration space for the Alpha product launch team.",
    memberCount: 12,
    isJoined: false,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "6",
    name: "Leadership Circle",
    type: "Team",
    description: "A space for team leads and managers to discuss leadership strategies.",
    memberCount: 15,
    isJoined: false,
    image: "/placeholder.svg?height=80&width=80",
  },
]

export default function CollaborationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredGroups, setFilteredGroups] = useState(groups)
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredGroups(groups)
      return
    }
    
    const filtered = groups.filter(group => 
      group.name.toLowerCase().includes(query.toLowerCase()) ||
      group.description.toLowerCase().includes(query.toLowerCase()) ||
      group.type.toLowerCase().includes(query.toLowerCase())
    )
    
    setFilteredGroups(filtered)
  }
  
  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
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
      
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search groups..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>All Types</DropdownMenuItem>
              <DropdownMenuItem>Interest Groups</DropdownMenuItem>
              <DropdownMenuItem>Project Groups</DropdownMenuItem>
              <DropdownMenuItem>Team Groups</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Groups</TabsTrigger>
          <TabsTrigger value="joined">My Groups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group, index) => (
              <GroupCard key={group.id} group={group} index={index} />
            ))}
          </div>
          
          {filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No groups found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="joined" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.filter(group => group.isJoined).map((group, index) => (
              <GroupCard key={group.id} group={group} index={index} />
            ))}
          </div>
          
          {filteredGroups.filter(group => group.isJoined).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">You haven't joined any groups yet</h3>
              <p className="text-sm text-muted-foreground">Join a group to collaborate with your colleagues</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GroupCard({ group, index }: { group: any, index: number }) {
  const [isJoined, setIsJoined] = useState(group.isJoined)
  
  const handleJoinLeave = () => {
    setIsJoined(!isJoined)
    // In a real app, this would make an API call
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={group.image || "/placeholder.svg"} alt={group.name} />
                <AvatarFallback>{group.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <CardDescription>{group.memberCount} members</CardDescription>
              </div>
            </div>
            <Badge variant="outline">{group.type}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm line-clamp-2">{group.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/collaboration/groups/${group.id}`}>View Details</Link>
          </Button>
          <Button 
            variant={isJoined ? "outline" : "default"} 
            size="sm"
            onClick={handleJoinLeave}
          >
            {isJoined ? "Leave" : "Join"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
