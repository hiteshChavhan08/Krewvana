"use client"

import React from "react"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { staggerContainer } from "@/lib/animations"

interface AnimatedListProps {
  children: ReactNode
  className?: string
  itemClassName?: string
}

export function AnimatedList({ children, className, itemClassName }: AnimatedListProps) {
  // Convert children to array to map over them
  const childrenArray = React.Children.toArray(children)

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className={className}>
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                damping: 25,
                stiffness: 500,
                delay: index * 0.05,
              },
            },
          }}
          className={itemClassName}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
