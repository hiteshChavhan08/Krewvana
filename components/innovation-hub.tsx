"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Lightbulb, TrendingUp, Trophy } from 'lucide-react'
import Link from "next/link"
import { motion } from "framer-motion"

export function InnovationHub() {
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
        <h2 className="text-3xl font-bold tracking-tight">Innovation Hub</h2>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/innovation/ideas/submit">Submit Idea</Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="ideas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="my-innovations">My Innovations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ideas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Ideas
                </CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">248</div>
                <p className="text-xs text-muted-foreground">
                  +12 this month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Implemented
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">
                  +3 this quarter
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Challenges
                </CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Ends in 14 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Your Contributions
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-muted-foreground">
                  2 in review
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Featured Ideas</CardTitle>
                <CardDescription>
                  Top ideas from our innovation community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="space-y-4"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {[
                    {
                      id: 1,
                      title: "AI-Powered Customer Support Assistant",
                      author: "Michael Chen",
                      department: "Engineering",
                      votes: 42,
                      comments: 12,
                      status: "In Review"
                    },
                    {
                      id: 2,
                      title: "Sustainable Office Initiative",
                      author: "Emily Rodriguez",
                      department: "Operations",
                      votes: 38,
                      comments: 8,
                      status: "Approved"
                    },
                    {
                      id: 3,
                      title: "Cross-Department Mentorship Program",
                      author: "David Kim",
                      department: "HR",
                      votes: 35,
                      comments: 15,
                      status: "In Progress"
                    }
                  ].map((idea) => (
                    <motion.div key={idea.id} variants={item}>
                      <div className="flex items-start space-x-4 rounded-md border p-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{idea.title}</h4>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <span>By {idea.author}</span>
                            <span>•</span>
                            <span>{idea.department}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm">
                              <TrendingUp className="h-4 w-4" />
                              <span>{idea.votes} votes</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <span>{idea.comments} comments</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                            idea.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                            idea.status === "In Review" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" :
                            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          }`}>
                            {idea.status}
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/innovation/ideas/${idea.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/innovation/ideas">View All Ideas</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Active Challenges</CardTitle>
                <CardDescription>
                  Participate in innovation challenges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      title: "Customer Experience Improvement",
                      deadline: "Apr 30, 2025",
                      participants: 28,
                      prize: "500 points + Recognition"
                    },
                    {
                      id: 2,
                      title: "Sustainability Initiative",
                      deadline: "May 15, 2025",
                      participants: 42,
                      prize: "750 points + Implementation Budget"
                    },
                    {
                      id: 3,
                      title: "Process Optimization",
                      deadline: "Jun 10, 2025",
                      participants: 15,
                      prize: "600 points + Mentorship"
                    }
                  ].map((challenge) => (
                    <div key={challenge.id} className="rounded-md border p-4">
                      <h4 className="font-medium">{challenge.title}</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deadline:</span>
                          <span>{challenge.deadline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Participants:</span>
                          <span>{challenge.participants}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prize:</span>
                          <span>{challenge.prize}</span>
                        </div>
                      </div>
                      <Button asChild className="mt-3 w-full" size="sm">
                        <Link href={`/innovation/challenges/${challenge.id}`}>Join Challenge</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Innovation Challenges</CardTitle>
              <CardDescription>
                Participate in company-wide innovation challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    title: "Customer Experience Improvement",
                    description: "How can we enhance our customer experience across all touchpoints?",
                    deadline: "Apr 30, 2025",
                    participants: 28,
                    prize: "500 points + Recognition",
                    status: "Active"
                  },
                  {
                    id: 2,
                    title: "Sustainability Initiative",
                    description: "Propose ideas to make our company more environmentally sustainable.",
                    deadline: "May 15, 2025",
                    participants: 42,
                    prize: "750 points + Implementation Budget",
                    status: "Active"
                  },
                  {
                    id: 3,
                    title: "Process Optimization",
                    description: "Identify and solve inefficiencies in our internal processes.",
                    deadline: "Jun 10, 2025",
                    participants: 15,
                    prize: "600 points + Mentorship",
                    status: "Active"
                  },
                  {
                    id: 4,
                    title: "Remote Work Improvement",
                    description: "How can we enhance our remote work experience?",
                    deadline: "Mar 15, 2025",
                    participants: 56,
                    prize: "500 points + Recognition",
                    status: "Completed",
                    winner: "Sarah Johnson - Virtual Coffee Roulette"
                  }
                ].map((challenge) => (
                  <div key={challenge.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{challenge.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                      <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                        challenge.status === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      }`}>
                        {challenge.status}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Deadline:</span>
                        <span className="ml-1">{challenge.deadline}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Participants:</span>
                        <span className="ml-1">{challenge.participants}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Prize:</span>
                        <span className="ml-1">{challenge.prize}</span>
                      </div>
                      {challenge.winner && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Winner:</span>
                          <span className="ml-1">{challenge.winner}</span>
                        </div>
                      )}
                    </div>
                    {challenge.status === "Active" && (
                      <Button asChild className="mt-3 w-full">
                        <Link href={`/innovation/challenges/${challenge.id}`}>View Challenge</Link>
                      </Button>
                    )}
                    {challenge.status === "Completed" && (
                      <Button asChild variant="outline" className="mt-3 w-full">
                        <Link href={`/innovation/challenges/${challenge.id}`}>View Results</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="my-innovations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Ideas</CardTitle>
              <CardDescription>
                Ideas you've submitted or contributed to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    title: "Cross-Department Knowledge Sharing Platform",
                    submitted: "Mar 10, 2025",
                    votes: 18,
                    comments: 5,
                    status: "In Review"
                  },
                  {
                    id: 2,
                    title: "Employee Wellness Program Enhancement",
                    submitted: "Feb 22, 2025",
                    votes: 24,
                    comments: 7,
                    status: "Approved"
                  },
                  {
                    id: 3,
                    title: "Automated Onboarding Process",
                    submitted: "Jan 15, 2025",
                    votes: 32,
                    comments: 9,
                    status: "Implemented"
                  }
                ].map((idea) => (
                  <div key={idea.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{idea.title}</h4>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Submitted on {idea.submitted}
                        </div>
                      </div>
                      <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                        idea.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                        idea.status === "In Review" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" :
                        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      }`}>
                        {idea.status}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        <span>{idea.votes} votes</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span>{idea.comments} comments</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link href={`/innovation/ideas/${idea.id}`}>View</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link href={`/innovation/ideas/${idea.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/innovation/ideas/submit">Submit New Idea</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>My Challenge Submissions</CardTitle>
              <CardDescription>
                Your participation in innovation challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    challenge: "Customer Experience Improvement",
                    submission: "AI-Powered Customer Feedback Analysis",
                    submitted: "Apr 5, 2025",
                    status: "Submitted"
                  },
                  {
                    id: 2,
                    challenge: "Remote Work Improvement",
                    submission: "Virtual Team Building Activities Platform",
                    submitted: "Mar 10, 2025",
                    status: "Finalist"
                  }
                ].map((submission) => (
                  <div key={submission.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{submission.challenge}</h4>
                        <p className="mt-1 text-sm">{submission.submission}</p>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Submitted on {submission.submitted}
                        </div>
                      </div>
                      <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                        submission.status === "Finalist" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" :
                        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      }`}>
                        {submission.status}
                      </div>
                    </div>
                    <Button asChild size="sm" className="mt-3 w-full">
                      <Link href={`/innovation/challenges/submissions/${submission.id}`}>View Submission</Link>
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
