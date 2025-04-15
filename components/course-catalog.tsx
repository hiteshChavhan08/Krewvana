"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, ChevronDown, Filter, Search, Users } from 'lucide-react'
import Link from "next/link"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function CourseCatalog() {
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
        <h2 className="text-3xl font-bold tracking-tight">Course Catalog</h2>
        <div className="flex items-center gap-2">
          <Select defaultValue="newest">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="az">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="md:w-64 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Difficulty</h4>
                <div className="space-y-2">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox id={`level-${level.toLowerCase()}`} />
                      <Label htmlFor={`level-${level.toLowerCase()}`}>{level}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Department</h4>
                <div className="space-y-2">
                  {["All Departments", "Engineering", "Design", "Marketing", "Product", "HR"].map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox id={`dept-${dept.toLowerCase().replace(/\s+/g, '-')}`} />
                      <Label htmlFor={`dept-${dept.toLowerCase().replace(/\s+/g, '-')}`}>{dept}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Source</h4>
                <div className="space-y-2">
                  {["Internal", "LinkedIn Learning", "Udemy", "Coursera"].map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox id={`source-${source.toLowerCase().replace(/\s+/g, '-')}`} />
                      <Label htmlFor={`source-${source.toLowerCase().replace(/\s+/g, '-')}`}>{source}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Duration</h4>
                <div className="space-y-2">
                  {["Under 1 hour", "1-3 hours", "3-6 hours", "6+ hours"].map((duration) => (
                    <div key={duration} className="flex items-center space-x-2">
                      <Checkbox id={`duration-${duration.toLowerCase().replace(/\s+/g, '-')}`} />
                      <Label htmlFor={`duration-${duration.toLowerCase().replace(/\s+/g, '-')}`}>{duration}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button className="w-full">Apply Filters</Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses..."
                className="pl-8"
              />
            </div>
          </div>
          
          <motion.div 
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
              },
              {
                id: 7,
                title: "Public Speaking",
                description: "Overcome fear and master the art of public speaking and presentations.",
                modules: 4,
                duration: "2.5 hours",
                level: "Beginner",
                enrolled: 145
              },
              {
                id: 8,
                title: "Advanced Excel for Data Analysis",
                description: "Master advanced Excel functions and techniques for data analysis.",
                modules: 6,
                duration: "4 hours",
                level: "Intermediate",
                enrolled: 230
              },
              {
                id: 9,
                title: "Introduction to Python Programming",
                description: "Learn the basics of Python programming language for data analysis and automation.",
                modules: 8,
                duration: "6 hours",
                level: "Beginner",
                enrolled: 310
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
          
          <div className="flex items-center justify-center space-x-2">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
