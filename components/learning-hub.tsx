"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, Search, Users } from 'lucide-react'
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { motion } from "framer-motion"

export function LearningHub() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Learning Hub</h2>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/learning/courses">Browse All Courses</Link>
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for courses, workshops, or skills..."
            className="pl-8"
          />
        </div>
      </div>
      
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="workshops">Workshops</TabsTrigger>
          <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
          <TabsTrigger value="my-learning">My Learning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses" className="space-y-4">
          <motion.div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {[
              {
                id: 1,
                title: "Design Thinking Fundamentals",
                description: "Learn the basics of design thinking and how to apply it to solve complex problems.",
                modules: 4,
                duration: "2 hours",
                level: "Beginner",
                enrolled: 128
              },
              {
                id: 2,
                title: "Project Management Essentials",
                description: "Master the fundamentals of project management and learn to deliver projects on time and within budget.",
                modules: 5,
                duration: "3 hours",
                level: "Intermediate",
                enrolled: 95
              },
              {
                id: 3,
                title: "Data Analytics Basics",
                description: "Introduction to data analytics concepts, tools, and methodologies.",
                modules: 6,
                duration: "4 hours",
                level: "Beginner",
                enrolled: 210
              },
              {
                id: 4,
                title: "Leadership Skills",
                description: "Develop essential leadership skills to effectively manage teams and drive results.",
                modules: 8,
                duration: "6 hours",
                level: "Advanced",
                enrolled: 156
              },
              {
                id: 5,
                title: "Effective Communication",
                description: "Improve your communication skills to better convey ideas and collaborate with others.",
                modules: 3,
                duration: "1.5 hours",
                level: "Beginner",
                enrolled: 320
              },
              {
                id: 6,
                title: "Agile Methodology",
                description: "Learn the principles and practices of Agile methodology for software development.",
                modules: 7,
                duration: "5 hours",
                level: "Intermediate",
                enrolled: 175
              }
            ].map((course) => (
              <motion.div key={course.id} variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{course.modules} modules</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{course.enrolled} enrolled</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm font-medium">{course.level}</div>
                    <Button asChild size="sm">
                      <Link href={`/learning/courses/${course.id}`}>View Course</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
        
        <TabsContent value="workshops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Workshops</CardTitle>
              <CardDescription>
                Register for live workshops and webinars
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    title: "Design Thinking Workshop",
                    date: "Apr 16, 2025",
                    time: "10:00 AM - 12:00 PM",
                    location: "Conference Room A",
                    presenter: "Sarah Johnson",
                    spots: "5 spots left"
                  },
                  {
                    id: 2,
                    title: "Agile Scrum Master Certification Prep",
                    date: "Apr 22, 2025",
                    time: "9:00 AM - 4:00 PM",
                    location: "Training Center",
                    presenter: "Michael Chen",
                    spots: "2 spots left"
                  },
                  {
                    id: 3,
                    title: "Data Visualization Best Practices",
                    date: "Apr 28, 2025",
                    time: "1:00 PM - 3:00 PM",
                    location: "Zoom Webinar",
                    presenter: "Emily Rodriguez",
                    spots: "Unlimited"
                  }
                ].map((workshop) => (
                  <div key={workshop.id} className="flex items-start space-x-4 rounded-md border p-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{workshop.title}</h4>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {workshop.date} • {workshop.time}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Location: {workshop.location}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Presenter: {workshop.presenter}
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        {workshop.spots}
                      </div>
                    </div>
                    <Button>Register</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mentorship" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mentorship Program</CardTitle>
              <CardDescription>
                Connect with mentors or become a mentor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Find a Mentor</CardTitle>
                    <CardDescription>
                      Connect with experienced professionals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Browse our directory of mentors and find someone who can help you grow in your career.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Browse Mentors</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Become a Mentor</CardTitle>
                    <CardDescription>
                      Share your knowledge and experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Help others grow by sharing your expertise and experience as a mentor.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Apply as Mentor</Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="my-learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Learning Progress</CardTitle>
              <CardDescription>
                Track your enrolled courses and learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
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
                ].map((course) => (
                  <div key={course.id} className="space-y-2 rounded-md border p-4">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{course.title}</h4>
                      <span className="text-sm text-muted-foreground">{course.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{course.completed} / {course.total}</span>
                      <span>Due: {course.dueDate}</span>
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full mt-2">
                      <Link href={`/learning/courses/${course.id}`}>Continue Learning</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
