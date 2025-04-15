"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, Smartphone, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSaveNotifications = () => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.message(
        "Settings saved",{
        description: "Your notification preferences have been updated",
      })

      setIsSubmitting(false)
    }, 1000)
  }

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.message(
        "Password updated",{
        description: "Your password has been changed successfully",
      })
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="connected">
            <Smartphone className="mr-2 h-4 w-4" />
            Connected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="email-recognitions" className="flex-1">
                      Recognition notifications
                      <p className="text-sm text-muted-foreground">Receive emails when someone recognizes you</p>
                    </Label>
                    <Switch id="email-recognitions" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="email-learning" className="flex-1">
                      Learning updates
                      <p className="text-sm text-muted-foreground">
                        Receive emails about new courses and learning opportunities
                      </p>
                    </Label>
                    <Switch id="email-learning" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="email-events" className="flex-1">
                      Event reminders
                      <p className="text-sm text-muted-foreground">
                        Receive reminders about upcoming events and workshops
                      </p>
                    </Label>
                    <Switch id="email-events" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="email-groups" className="flex-1">
                      Group activity
                      <p className="text-sm text-muted-foreground">
                        Receive emails about activity in groups you've joined
                      </p>
                    </Label>
                    <Switch id="email-groups" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">In-App Notifications</h3>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="app-recognitions" className="flex-1">
                      Recognition notifications
                      <p className="text-sm text-muted-foreground">Receive notifications when someone recognizes you</p>
                    </Label>
                    <Switch id="app-recognitions" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="app-comments" className="flex-1">
                      Comments and replies
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when someone comments on your posts
                      </p>
                    </Label>
                    <Switch id="app-comments" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="app-groups" className="flex-1">
                      Group activity
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about activity in groups you've joined
                      </p>
                    </Label>
                    <Switch id="app-groups" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="app-events" className="flex-1">
                      Event reminders
                      <p className="text-sm text-muted-foreground">
                        Receive reminders about upcoming events and workshops
                      </p>
                    </Label>
                    <Switch id="app-events" defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotifications} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="account">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <form onSubmit={handleSavePassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="profile-visibility" className="flex-1">
                    Profile visibility
                    <p className="text-sm text-muted-foreground">Make your profile visible to all company employees</p>
                  </Label>
                  <Switch id="profile-visibility" defaultChecked />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="leaderboard-visibility" className="flex-1">
                    Leaderboard visibility
                    <p className="text-sm text-muted-foreground">Show your name and points on public leaderboards</p>
                  </Label>
                  <Switch id="leaderboard-visibility" defaultChecked />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="skills-visibility" className="flex-1">
                    Skills visibility
                    <p className="text-sm text-muted-foreground">Make your skills visible for mentorship matching</p>
                  </Label>
                  <Switch id="skills-visibility" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline">Save Privacy Settings</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="connected">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Connected Apps</CardTitle>
                <CardDescription>Manage apps and services connected to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Fitness Trackers</h3>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="font-medium">Fitbit</div>
                      <div className="text-sm text-muted-foreground">Connected on June 12, 2023</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="font-medium">Apple Health</div>
                      <div className="text-sm text-muted-foreground">Not connected</div>
                    </div>
                    <Button size="sm">Connect</Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="font-medium">Google Fit</div>
                      <div className="text-sm text-muted-foreground">Not connected</div>
                    </div>
                    <Button size="sm">Connect</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Calendar Services</h3>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="font-medium">Google Calendar</div>
                      <div className="text-sm text-muted-foreground">Connected on March 5, 2023</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="font-medium">Microsoft Outlook</div>
                      <div className="text-sm text-muted-foreground">Not connected</div>
                    </div>
                    <Button size="sm">Connect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
