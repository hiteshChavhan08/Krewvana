"use client"

import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"

export function MyProgress() {
  const learningProgress = [
    {
      id: 1,
      title: "Design Thinking Fundamentals",
      progress: 75,
      total: "4 modules",
      completed: "3 modules",
      dueDate: "Apr 30, 2025"
    },
    {
      id: 2,
      title: "Project Management Essentials",
      progress: 40,
      total: "5 modules",
      completed: "2 modules",
      dueDate: "May 15, 2025"
    },
    {
      id: 3,
      title: "Data Analytics Basics",
      progress: 10,
      total: "6 modules",
      completed: "1 module",
      dueDate: "Jun 10, 2025"
    }
  ]
  
  const wellnessProgress = [
    {
      id: 1,
      title: "10,000 Steps Challenge",
      progress: 65,
      total: "10,000 steps",
      completed: "6,500 steps",
      dueDate: "Today"
    },
    {
      id: 2,
      title: "Mindfulness Minutes",
      progress: 80,
      total: "30 minutes",
      completed: "24 minutes",
      dueDate: "Today"
    },
    {
      id: 3,
      title: "Monthly Wellness Challenge",
      progress: 45,
      total: "20 activities",
      completed: "9 activities",
      dueDate: "Apr 30, 2025"
    }
  ]
  
  const innovationProgress = [
    {
      id: 1,
      title: "Customer Experience Challenge",
      progress: 50,
      total: "Submission",
      completed: "Draft created",
      dueDate: "Apr 25, 2025"
    },
    {
      id: 2,
      title: "Sustainability Idea",
      progress: 90,
      total: "Implementation",
      completed: "Testing phase",
      dueDate: "May 5, 2025"
    }
  ]
  
  const ProgressItem = ({ item }: { item: any }) => (
    <motion.div 
      className="space-y-2 py-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between text-sm">
        <div className="font-medium">{item.title}</div>
        <div className="text-muted-foreground">{item.completed} / {item.total}</div>
      </div>
      <Progress value={item.progress} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <div>Due: {item.dueDate}</div>
        <div>{item.progress}% complete</div>
      </div>
    </motion.div>
  )
  
  return (
    <Tabs defaultValue="learning">
      <TabsList className="mb-4">
        <TabsTrigger value="learning">Learning</TabsTrigger>
        <TabsTrigger value="wellness">Wellness</TabsTrigger>
        <TabsTrigger value="innovation">Innovation</TabsTrigger>
      </TabsList>
      <TabsContent value="learning" className="space-y-4">
        {learningProgress.map(item => (
          <ProgressItem key={item.id} item={item} />
        ))}
      </TabsContent>
      <TabsContent value="wellness" className="space-y-4">
        {wellnessProgress.map(item => (
          <ProgressItem key={item.id} item={item} />
        ))}
      </TabsContent>
      <TabsContent value="innovation" className="space-y-4">
        {innovationProgress.map(item => (
          <ProgressItem key={item.id} item={item} />
        ))}
      </TabsContent>
    </Tabs>
  )
}
