"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, CheckCircle, Clock, Download, ExternalLink, Play, Star, Users } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { useState } from "react"

export function CourseDetail({ courseId }: { courseId: string }) {
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // This would normally be fetched from an API based on courseId
  const course = {
    id: courseId,
    title: "Design Thinking Fundamentals",
    description: "Learn the basics of design thinking and how to apply it to solve complex problems. This course covers the entire design thinking process from empathy to testing.",
    modules: [
      {
        id: "m1",
        title: "Introduction to Design Thinking",
        duration: "30 minutes",
        completed: false
      },
      {
        id: "m2",
        title: "Empathize: Understanding User Needs",
        duration: "45 minutes",
        completed: false
      },
      {
        id: "m3",
        title: "Define: Framing the Problem",
        duration: "30 minutes",
        completed: false
      },
      {
        id: "m4",
        title: "Ideate: Generating Solutions",
        duration: "45 minutes",
        completed: false
      },
      {
        id: "m5",
        title: "Prototype: Building Mockups",
        duration: "45 minutes",
        completed: false
      },
      {
        id: "m6",
        title: "Test: Validating Solutions",
        duration: "30 minutes",
        completed: false
      }
    ],
    level: "Beginner",
    duration: "3.5 hours",
    enrolled: 128,
    rating: 4.8,
    reviews: 42,
    instructor: {
      name: "Sarah Johnson",
      title: "Design Director",
      avatar: "/placeholder.svg?height=40&width=40",
      bio: "Sarah has over 10 years of experience in design thinking and user experience design. She has worked with Fortune 500 companies to implement design thinking methodologies."
    },
    tags: ["Design", "UX", "Problem Solving", "Innovation"]
  }
  
  const handleEnroll = () => {
    setIsEnrolled(true)
    // This would normally make an API call to enroll the user
  }
  
  const handleModuleComplete = (moduleId: string) => {
    // This would normally make an API call to mark the module as complete
    const completedCount = course.modules.filter(m => m.completed).length + 1
    const newProgress = Math.round((completedCount / course.modules.length) * 100)
    setProgress(newProgress)
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{course.title}</h2>
            <p className="mt-2 text-muted-foreground">{course.description}</p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {course.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 md:text-right">
            {!isEnrolled ? (
              <Button size="lg" onClick={handleEnroll}>Enroll Now</Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-medium">{progress}% Complete</span>
                </div>
                <Progress value={progress} className="h-2 w-[200px]" />
                <Button size="lg">Continue Learning</Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
              <CardDescription>
                {course.modules.length} modules • {course.duration} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.modules.map((module, index) => (
                  <div key={module.id} className="flex items-start justify-between rounded-md border p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {module.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{module.title}</h4>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{module.duration}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant={module.completed ? "outline" : "default"}>
                      {module.completed ? "Revisit" : "Start"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Level</span>
                  <span className="font-medium">{course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Enrolled</span>
                  <span className="font-medium">{course.enrolled} learners</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center">
                    <span className="font-medium">{course.rating}</span>
                    <div className="ml-1 flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(course.rating)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({course.reviews})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={course.instructor.avatar || "/placeholder.svg"} alt={course.instructor.name} />
                    <AvatarFallback>{course.instructor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{course.instructor.name}</h4>
                    <p className="text-sm text-muted-foreground">{course.instructor.title}</p>
                  </div>
                </div>
                <p className="text-sm">{course.instructor.bio}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Course Materials
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Additional Reading
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
