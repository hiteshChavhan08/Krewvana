"use client"

import { motion, type Variants } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AnimatedContainerProps {
  children: ReactNode
  variants?: Variants
  className?: string
  delay?: number
  duration?: number
  initial?: string
  animate?: string
  exit?: string
}

export function AnimatedContainer({
  children,
  variants,
  className,
  delay = 0,
  duration = 0.4,
  initial = "hidden",
  animate = "visible",
  exit = "hidden",
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      variants={variants}
      transition={{ delay, duration }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
