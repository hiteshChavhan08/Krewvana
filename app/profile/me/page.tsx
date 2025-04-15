"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Award, BookOpen, Edit, Heart, Mail, MapPin, Phone, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

// Mock user data
const userData = {
  id: "1",
  name: "John Doe",
  title: "Senior Product Designer",
  department: "Design",
  avatar: "/placeholder.svg?height=128&width=128",
  initials: "JD",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  bio: "Product designer with 5+ years of experience in creating user-centered digital experiences. Passionate about solving complex problems through design thinking and collaboration.",
  joinedDate: "January 2020",
  skills: ["UI Design", "UX Research", "Prototyping", "Design Systems", "User Testing", "Figma", "Sketch"],
  interests: ["Photography", "Hiking", "Reading", "Travel"],
  points: 1250,
  badges: [
    { id: "1", name: "Team Player", icon: "🤝", earnedDate: "3 months ago" },
    { id: "2", name: "Innovation Guru", icon: "🚀", earnedDate: "6 months ago" },
    { id: "3", name: "Problem Solver", icon: "💡", earnedDate: "1 year ago" },
  ],
  recognitionsReceived: [
    {
      id: "1",
      giver: {
        name: "Maria Garcia",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "MG",
      },
      message:
        "Thank you for your exceptional work on the redesign project. Your attention to detail and creative solutions really made a difference!",
      value: "Excellence",
      points: 50,
      createdAt: "2 weeks ago",
    },
    {
      id: "2",
      giver: {
        name: "Alex Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "AJ",
      },
      message:
        "Your collaboration on the client presentation was invaluable. You consistently went above and beyond to ensure everyone was aligned.",
      value: "Teamwork",
      points: 30,
      createdAt: "1 month ago",
    },
  ],
  recognitionsGiven: [
    {
      id: "1",
      recipient: {
        name: "Taylor Kim",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "TK",
      },
      message:
        "Your frontend implementation of our designs was flawless. Thank you for the attention to detail and for making our vision come to life!",
      value: "Excellence",
      points: 40,
      createdAt: "3 weeks ago",
    },
  ],
  learningProgress: [
    {
      id: "1",
      title: "Advanced UX Research Methods",
      progress: 75,
      totalModules: 8,
      completedModules: 6,
    },
    {
      id: "2",
      title: "Design Leadership",
      progress: 30,
      totalModules: 10,
      completedModules: 3,
    },
  ],
  wellnessChallenges: [
    {
      id: "1",
      title: "10,000 Steps Challenge",
      progress: 65,
      goal: "10,000 steps daily",
      daysCompleted: 13,
      totalDays: 20,
    },
  ],
}

export default function ProfilePage() {
  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <Button asChild>
          <Link href="/profile/me/edit">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="md:col-span-1"
        >
          <Card>
            <CardHeader className="text-center">
              <Avatar className="mx-auto h-24 w-24">
                <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                <AvatarFallback>{userData.initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{userData.name}</CardTitle>
              <CardDescription>{userData.title}</CardDescription>
              <Badge variant="outline" className="mt-1">
                {userData.department}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userData.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{userData.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{userData.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Joined {userData.joinedDate}</span>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 font-medium">Bio</h3>
                <p className="text-sm text-muted-foreground">{userData.bio}</p>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {userData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {userData.interests.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="md:col-span-2"
        >
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Points & Badges</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {userData.points} points
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {userData.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center justify-center rounded-lg border p-4 text-center"
                  >
                    <div className="text-3xl">{badge.icon}</div>
                    <h3 className="mt-2 font-medium">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground">Earned {badge.earnedDate}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="recognitions" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="recognitions">Recognitions</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="wellness">Wellness</TabsTrigger>
            </TabsList>

            <TabsContent value="recognitions">
              <Card>
                <CardHeader>
                  <CardTitle>Recognitions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="received">
                    <TabsList className="mb-4 w-full">
                      <TabsTrigger value="received" className="flex-1">
                        Received ({userData.recognitionsReceived.length})
                      </TabsTrigger>
                      <TabsTrigger value="given" className="flex-1">
                        Given ({userData.recognitionsGiven.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="received" className="space-y-4">
                      {userData.recognitionsReceived.map((recognition) => (
                        <div key={recognition.id} className="rounded-lg border p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={recognition.giver.avatar || "/placeholder.svg"}
                                alt={recognition.giver.name}
                              />
                              <AvatarFallback>{recognition.giver.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{recognition.giver.name}</div>
                              <div className="text-xs text-muted-foreground">{recognition.createdAt}</div>
                            </div>
                            <Badge className="ml-auto" variant="outline">
                              {recognition.points} pts
                            </Badge>
                          </div>
                          <p className="text-sm">{recognition.message}</p>
                          <Badge variant="secondary" className="mt-2">
                            {recognition.value}
                          </Badge>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="given" className="space-y-4">
                      {userData.recognitionsGiven.map((recognition) => (
                        <div key={recognition.id} className="rounded-lg border p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={recognition.recipient.avatar || "/placeholder.svg"}
                                alt={recognition.recipient.name}
                              />
                              <AvatarFallback>{recognition.recipient.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{recognition.recipient.name}</div>
                              <div className="text-xs text-muted-foreground">{recognition.createdAt}</div>
                            </div>
                            <Badge className="ml-auto" variant="outline">
                              {recognition.points} pts
                            </Badge>
                          </div>
                          <p className="text-sm">{recognition.message}</p>
                          <Badge variant="secondary" className="mt-2">
                            {recognition.value}
                          </Badge>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learning">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userData.learningProgress.map((course) => (
                      <div key={course.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{course.title}</h3>
                          <span className="text-sm text-muted-foreground">
                            {course.completedModules}/{course.totalModules} modules
                          </span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/learning/my-progress">
                      <BookOpen className="mr-2 h-4 w-4" />
                      View All Courses
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="wellness">
              <Card>
                <CardHeader>
                  <CardTitle>Wellness Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userData.wellnessChallenges.map((challenge) => (
                      <div key={challenge.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{challenge.title}</h3>
                          <span className="text-sm text-muted-foreground">
                            {challenge.daysCompleted}/{challenge.totalDays} days
                          </span>
                        </div>
                        <Progress value={challenge.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">Goal: {challenge.goal}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/wellness/challenges">
                      <Heart className="mr-2 h-4 w-4" />
                      View All Challenges
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
