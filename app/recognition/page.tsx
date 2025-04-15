"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Award, ChevronRight, MessageSquare, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for recognition feed
const recognitions = [
  {
    id: "1",
    giver: {
      name: "Alex Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "AJ",
    },
    recipient: {
      name: "Maria Garcia",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "MG",
    },
    message:
      "Thank you for your exceptional work on the client presentation. Your attention to detail and creative approach really made a difference!",
    value: "Excellence",
    points: 50,
    badge: "Star Performer",
    createdAt: "2 hours ago",
    likes: 12,
    comments: 3,
  },
  {
    id: "2",
    giver: {
      name: "Sam Wilson",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "SW",
    },
    recipient: {
      name: "Taylor Kim",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "TK",
    },
    message:
      "Your collaboration on the project was invaluable. You consistently went above and beyond to ensure everyone was aligned and the work was top-notch.",
    value: "Teamwork",
    points: 30,
    badge: "Team Player",
    createdAt: "1 day ago",
    likes: 8,
    comments: 2,
  },
  {
    id: "3",
    giver: {
      name: "Jordan Lee",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "JL",
    },
    recipient: {
      name: "Casey Morgan",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "CM",
    },
    message:
      "Your innovative solution to our database issue saved us countless hours and potential downtime. This is exactly the kind of forward thinking we need!",
    value: "Innovation",
    points: 75,
    badge: "Problem Solver",
    createdAt: "2 days ago",
    likes: 15,
    comments: 5,
  },
]

export default function RecognitionPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recognition</h1>
          <p className="text-muted-foreground">Celebrate achievements and appreciate your colleagues</p>
        </div>
        <Button asChild>
          <Link href="/recognition/give">Give Recognition</Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Recognitions</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="given">Given</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {recognitions.map((recognition, index) => (
            <RecognitionCard key={recognition.id} recognition={recognition} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          <p className="text-center text-muted-foreground py-8">No recognitions received yet</p>
        </TabsContent>

        <TabsContent value="given" className="space-y-4">
          <p className="text-center text-muted-foreground py-8">No recognitions given yet</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RecognitionCard({ recognition, index }: { recognition: any; index: number }) {
  const [liked, setLiked] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={recognition.giver.avatar || "/placeholder.svg"} alt={recognition.giver.name} />
                <AvatarFallback>{recognition.giver.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  {recognition.giver.name}
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={recognition.recipient.avatar || "/placeholder.svg"}
                      alt={recognition.recipient.name}
                    />
                    <AvatarFallback>{recognition.recipient.initials}</AvatarFallback>
                  </Avatar>
                  {recognition.recipient.name}
                </div>
                <div className="text-xs text-muted-foreground">{recognition.createdAt}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                {recognition.points} pts
              </Badge>
              {recognition.badge && <Badge className="bg-amber-500 hover:bg-amber-600">{recognition.badge}</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{recognition.message}</p>
          <div className="mt-3">
            <Badge variant="secondary">{recognition.value}</Badge>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-3 flex justify-between">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setLiked(!liked)}>
            <ThumbsUp className={`mr-1 h-4 w-4 ${liked ? "fill-current text-primary" : ""}`} />
            {liked ? recognition.likes + 1 : recognition.likes}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <MessageSquare className="mr-1 h-4 w-4" />
            {recognition.comments}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
