"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, HelpCircle, Mic, ArrowRight } from "lucide-react"
import { AMASessionStatus } from "@prisma/client"
import { getAMAStatusBadgeVariant, getInitials } from "@/lib/utils/helpers"
import { formatShortDate, formatTime } from "@/lib/utils/date-helpers"
import { motion } from "framer-motion"
import { pulse } from "@/lib/animations"

type AMASessionData = {
  id: string
  title: string
  description: string | null
  scheduledAt: string | Date
  status: AMASessionStatus
  isTechSpecific: boolean
  topic: string | null
  host: {
    id: string
    name: string | null
    image: string | null
  }
  _count: {
    questions: number
  }
}

const getStatusText = (status: AMASessionStatus): string => {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

interface SessionCardProps {
  session: AMASessionData
  index: number
}

export function AMASessionCard({ session, index }: SessionCardProps) {
  const isLive = session.status === AMASessionStatus.LIVE
  const isUpcoming = session.status === AMASessionStatus.UPCOMING

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05, // Reduced delay for faster appearance
        duration: 0.3,
        type: "spring",
        damping: 15,
      }}
      whileHover={{
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.2 },
      }}
    >
      <Link href={`/ama/${session.id}`} className="block h-full">
        <Card className="h-full flex flex-col transition-all duration-300 overflow-hidden group">
          {isLive && <div className="h-1 bg-red-500 w-full animate-pulse"></div>}
          {isUpcoming && <div className="h-1 bg-blue-500 w-full"></div>}
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start gap-2 mb-1">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                {session.title}
              </CardTitle>
              {isLive ? (
                <motion.div variants={pulse} animate="visible">
                  <Badge
                    variant={getAMAStatusBadgeVariant(session.status)}
                    className="capitalize text-xs whitespace-nowrap bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700/50"
                  >
                    {getStatusText(session.status)}
                  </Badge>
                </motion.div>
              ) : (
                <Badge
                  variant={getAMAStatusBadgeVariant(session.status)}
                  className="capitalize text-xs whitespace-nowrap"
                >
                  {getStatusText(session.status)}
                </Badge>
              )}
            </div>
            {session.isTechSpecific && session.topic && (
              <Badge variant="outline" className="w-fit text-xs">
                {session.topic}
              </Badge>
            )}
            {session.description && (
              <CardDescription className="text-sm text-muted-foreground pt-1 line-clamp-2">
                {session.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-grow text-sm text-muted-foreground space-y-3 pb-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary/70" />
              <span>{formatShortDate(session.scheduledAt)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary/70" />
              <span>{formatTime(session.scheduledAt)}</span>
            </div>
            <div className="flex items-center">
              <Mic className="h-4 w-4 mr-2 text-primary/70" />
              <span className="mr-1">Hosted by</span>
              <Avatar className="h-5 w-5 mr-1">
                <AvatarImage src={session.host.image ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(session.host.name)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground/90">{session.host.name ?? "Host"}</span>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground flex justify-between items-center pt-2 border-t">
            <div className="flex items-center">
              <HelpCircle className="h-3.5 w-3.5 mr-1" />
              <span>
                {session._count.questions} Question
                {session._count.questions !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-primary flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              View details <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
