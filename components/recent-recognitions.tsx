import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp } from 'lucide-react'
import { Button } from "@/components/ui/button"

export function RecentRecognitions() {
  const recognitions = [
    {
      id: 1,
      from: {
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "SJ"
      },
      to: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "JD"
      },
      message: "Thanks for your help with the client presentation. Your insights were invaluable!",
      value: "Teamwork",
      points: 50,
      date: "2 days ago",
      likes: 5
    },
    {
      id: 2,
      from: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "JD"
      },
      to: {
        name: "Michael Chen",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "MC"
      },
      message: "Great job leading the innovation workshop. Everyone was engaged and we got some fantastic ideas!",
      value: "Leadership",
      points: 75,
      date: "3 days ago",
      likes: 8
    },
    {
      id: 3,
      from: {
        name: "Emily Rodriguez",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "ER"
      },
      to: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "JD"
      },
      message: "Your mentorship has been so helpful for my career growth. Thank you for always making time to answer my questions.",
      value: "Mentorship",
      points: 100,
      date: "1 week ago",
      likes: 12
    }
  ]
  
  return (
    <div className="space-y-4">
      {recognitions.map((recognition) => (
        <div key={recognition.id} className="rounded-md border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={recognition.from.avatar || "/placeholder.svg"} alt={recognition.from.name} />
                <AvatarFallback>{recognition.from.initials}</AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium">{recognition.from.name}</div>
              <div className="text-sm text-muted-foreground">recognized</div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={recognition.to.avatar || "/placeholder.svg"} alt={recognition.to.name} />
                <AvatarFallback>{recognition.to.initials}</AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium">{recognition.to.name}</div>
            </div>
            <Badge variant="outline">{recognition.value}</Badge>
          </div>
          <p className="text-sm">{recognition.message}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>+{recognition.points} points • {recognition.date}</div>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{recognition.likes}</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
