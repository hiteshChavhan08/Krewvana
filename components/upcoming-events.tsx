import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users } from 'lucide-react'

export function UpcomingEvents() {
  const events = [
    {
      id: 1,
      title: "Design Thinking Workshop",
      date: "Apr 16, 2025",
      time: "10:00 AM - 12:00 PM",
      location: "Conference Room A",
      attendees: 12,
      type: "workshop"
    },
    {
      id: 2,
      title: "Team Building: Virtual Escape Room",
      date: "Apr 18, 2025",
      time: "3:00 PM - 4:30 PM",
      location: "Zoom Meeting",
      attendees: 24,
      type: "social"
    },
    {
      id: 3,
      title: "Wellness Challenge Kickoff",
      date: "Apr 20, 2025",
      time: "9:00 AM",
      location: "Main Lobby",
      attendees: 45,
      type: "wellness"
    }
  ]
  
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex items-start space-x-4 rounded-md border p-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`/placeholder.svg?height=48&width=48`} alt={event.title} />
            <AvatarFallback>
              {event.type === "workshop" && "WS"}
              {event.type === "social" && "SC"}
              {event.type === "wellness" && "WL"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="font-medium leading-none">{event.title}</p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              <span>{event.date} • {event.time}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-1 h-3 w-3" />
              <span>{event.attendees} attendees</span>
            </div>
          </div>
          <Button size="sm">RSVP</Button>
        </div>
      ))}
    </div>
  )
}
