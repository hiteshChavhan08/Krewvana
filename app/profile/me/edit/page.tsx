"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Mock user data (same as in profile page)
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
}

export default function EditProfilePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: userData.name,
    title: userData.title,
    email: userData.email,
    phone: userData.phone,
    location: userData.location,
    bio: userData.bio,
    skills: userData.skills.join(", "),
    interests: userData.interests.join(", "),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate form
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required fields")
      setIsSubmitting(false)
      return
    }

    // Simulate API call
    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.message("Profile updated",{description: "Your profile has been updated successfully",})

      router.push("/profile/me")
    } catch (error) {
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push("/profile/me")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Profile
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                  <AvatarFallback>{userData.initials}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="mt-2">
                  <Upload className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" value={formData.location} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} className="min-h-[100px]" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Input id="skills" name="skills" value={formData.skills} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Interests (comma separated)</Label>
                <Input id="interests" name="interests" value={formData.interests} onChange={handleChange} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/profile/me")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
