"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Square, Ban, Loader2 } from "lucide-react"
import { AMASessionStatus } from "@prisma/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { fadeIn } from "@/lib/animations"
import { motion } from "framer-motion"

interface SessionStatusActionsProps {
  sessionId: string
  currentStatus: AMASessionStatus
}

export function SessionStatusActions({ sessionId, currentStatus }: SessionStatusActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<AMASessionStatus | false>(false)

  const handleUpdateStatus = async (newStatus: AMASessionStatus) => {
    setIsLoading(newStatus)
    const actionText = newStatus.toLowerCase()
    const toastId = toast.loading(`Updating status to ${actionText}...`)

    try {
      const response = await fetch(`/api/ama/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ${actionText} session`)
      }

      toast.success(`Session status updated to ${actionText}.`, { id: toastId })
      router.refresh()
    } catch (error: any) {
      console.error(`Failed to ${actionText} session:`, error)
      toast.error(`Error: ${error.message || `Could not ${actionText} session.`}`, { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatedContainer variants={fadeIn} className="flex items-center gap-2">
      {/* --- Start Session Button --- */}
      {currentStatus === AMASessionStatus.UPCOMING && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="sm"
            onClick={() => handleUpdateStatus(AMASessionStatus.LIVE)}
            disabled={!!isLoading}
            variant="destructive"
          >
            {isLoading === AMASessionStatus.LIVE ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Play className="h-4 w-4 mr-1.5" />
            )}
            Start Session Now
          </Button>
        </motion.div>
      )}

      {/* --- End Session Button --- */}
      {currentStatus === AMASessionStatus.LIVE && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="sm"
            onClick={() => handleUpdateStatus(AMASessionStatus.ENDED)}
            disabled={!!isLoading}
            variant="outline"
          >
            {isLoading === AMASessionStatus.ENDED ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Square className="h-4 w-4 mr-1.5" />
            )}
            End Session
          </Button>
        </motion.div>
      )}

      {/* --- Cancel Session Button (with confirmation) --- */}
      {(currentStatus === AMASessionStatus.UPCOMING || currentStatus === AMASessionStatus.LIVE) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={!!isLoading}
              >
                <Ban className="h-4 w-4 mr-1.5" /> Cancel Session
              </Button>
            </motion.div>
          </AlertDialogTrigger>
          <AlertDialogContent className="animate-in fade-in-50 slide-in-from-bottom-10 duration-300">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Session?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently cancel the session. Are you sure?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading === AMASessionStatus.CANCELLED}>Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleUpdateStatus(AMASessionStatus.CANCELLED)}
                disabled={isLoading === AMASessionStatus.CANCELLED}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading === AMASessionStatus.CANCELLED ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Yes, Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Display message if Ended/Cancelled */}
      {(currentStatus === AMASessionStatus.ENDED || currentStatus === AMASessionStatus.CANCELLED) && (
        <p className="text-sm text-muted-foreground italic">Session {currentStatus.toLowerCase()}.</p>
      )}
    </AnimatedContainer>
  )
}
