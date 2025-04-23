"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "lucide-react"
import { AMASessionStatus } from "@prisma/client"
import { getInitials, getAMAStatusBadgeVariant, getAMAStatusText } from "@/lib/utils/helpers"
import { formatDateTime } from "@/lib/utils/date-helpers"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { fadeIn, slideUp, pulse } from "@/lib/animations"
import { motion } from "framer-motion"

interface SessionHeaderProps {
  session: {
    id: string
    title: string
    description: string | null
    scheduledAt: Date | string
    status: AMASessionStatus
    host: {
      id: string
      name: string | null
      image: string | null
    }
  }
  isHost: boolean
}

export function SessionHeader({ session, isHost }: SessionHeaderProps) {
  const isLive = session.status === AMASessionStatus.LIVE

  return (
    <AnimatedContainer variants={slideUp} className="mb-6">
      <h1 className="text-3xl font-bold leading-tight mb-2">{session.title}</h1>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
        {isLive ? (
          <motion.div variants={pulse} animate="visible">
            <Badge
              variant={getAMAStatusBadgeVariant(session.status)}
              className={`capitalize text-xs inline-flex items-center whitespace-nowrap
                bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700/50
              `}
            >
              {getAMAStatusText(session.status)}
            </Badge>
          </motion.div>
        ) : (
          <Badge
            variant={getAMAStatusBadgeVariant(session.status)}
            className={`capitalize text-xs inline-flex items-center whitespace-nowrap
              ${
                session.status === AMASessionStatus.UPCOMING
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700/50"
                  : ""
              }
            `}
          >
            {getAMAStatusText(session.status)}
          </Badge>
        )}
        <div className="inline-flex items-center">
          <Calendar className="h-4 w-4 mr-1.5" />
          {formatDateTime(session.scheduledAt)}
        </div>
      </div>

      <AnimatedContainer variants={fadeIn} delay={0.2} className="flex items-center mb-4">
        <span className="text-sm text-muted-foreground mr-2">Hosted by:</span>
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={session.host.image ?? undefined} />
          <AvatarFallback>{getInitials(session.host.name)}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{session.host.name ?? "Host"}</span>
        {isHost && (
          <Badge variant="secondary" className="ml-2 text-xs">
            You
          </Badge>
        )}
      </AnimatedContainer>

      {session.description && (
        <AnimatedContainer variants={fadeIn} delay={0.3} className="text-base text-foreground/80">
          {session.description}
        </AnimatedContainer>
      )}
    </AnimatedContainer>
  )
}
