"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, BookOpen, Calendar, Heart, Lightbulb, TrendingUp, Users } from 'lucide-react'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UpcomingEvents } from "@/components/upcoming-events"
import { RecentRecognitions } from "@/components/recent-recognitions"
import { MyProgress } from "@/components/my-progress"

export function DashboardPage() {
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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/recognition/give">Give Recognition</Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <motion.div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Points
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,250</div>
                  <p className="text-xs text-muted-foreground">
                    +180 from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Learning Progress
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3 Courses</div>
                  <p className="text-xs text-muted-foreground">
                    2 completed this quarter
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Wellness Score
                  </CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-muted-foreground">
                    +5% from last week
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ideas Submitted
                  </CardTitle>
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">
                    1 approved this month
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>My Progress</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <MyProgress />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  Your scheduled events for the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingEvents />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Recognitions</CardTitle>
                <CardDescription>
                  Recent public recognitions received or given
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentRecognitions />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>
                  Frequently used actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/recognition/give">
                      <Award className="mr-2 h-4 w-4" />
                      Give Recognition
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/innovation/ideas/submit">
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Submit Idea
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/wellness/log-activity">
                      <Heart className="mr-2 h-4 w-4" />
                      Log Activity
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/learning/courses">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Browse Courses
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/events">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Events
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                View your personal analytics and progress over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Analytics dashboard coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                View and download your personal reports
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Reports dashboard coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
