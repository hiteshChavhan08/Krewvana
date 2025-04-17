// components/admin/learning/course-form.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"; // Optional: for react-hook-form
import { useForm } from "react-hook-form"; // Optional: for react-hook-form

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Define schema matching backend validation (or a subset for the form)
// This mirrors the create/update schemas from the API routes
const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().max(5000).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  url: z
    .string()
    .url("Invalid URL format")
    .optional()
    .nullable()
    .or(z.literal("")), // Allow empty string
  imageUrl: z
    .string()
    .url("Invalid image URL format")
    .optional()
    .nullable()
    .or(z.literal("")), // Allow empty string
  difficulty: z.string().max(50).optional().nullable(),
  tags: z.string().optional(), // Handle tags as comma-separated string in form
});

// Type for form values based on schema
type CourseFormValues = z.infer<typeof courseFormSchema>;

// Type for the initial data (can be partial for create)
// Matches the CourseSummary type used previously, but allows partial fields
type InitialCourseData = Partial<{
  id?: string; // Include ID if editing
  title?: string;
  description?: string | null;
  source?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  difficulty?: string | null;
  tags?: string[]; // API uses array, form will use string
}>;

interface CourseFormProps {
  initialData?: InitialCourseData | null; // Null for create, object for edit
  onSubmit: (values: CourseFormValues) => Promise<boolean>; // Returns true on success, false on failure
  mode: "create" | "edit";
}

export function CourseForm({
  initialData = null,
  onSubmit,
  mode,
}: CourseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Option 1: Basic State Management (Simpler) ---
  const [formData, setFormData] = useState<CourseFormValues>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    source: initialData?.source ?? "",
    url: initialData?.url ?? "",
    imageUrl: initialData?.imageUrl ?? "",
    difficulty: initialData?.difficulty ?? null, // Use null for empty Select
    tags: initialData?.tags?.join(", ") ?? "", // Join tags array for input
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    // Allow unselecting by mapping empty string back to null
    setFormData((prev) => ({ ...prev, difficulty: value || null }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);
    // Parent component handles redirection/toast based on success
  };
  // --- End Option 1 ---

  // --- Option 2: Using react-hook-form + Zod (More Robust) ---
  // Uncomment this section and comment out Option 1 if you prefer RHF
  /*
    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseFormSchema),
        defaultValues: {
            title: initialData?.title ?? "",
            description: initialData?.description ?? "",
            source: initialData?.source ?? "",
            url: initialData?.url ?? "",
            imageUrl: initialData?.imageUrl ?? "",
            difficulty: initialData?.difficulty ?? undefined, // RHF prefers undefined for empty select
            tags: initialData?.tags?.join(', ') ?? "",
        },
    });
    const { register, handleSubmit, formState: { errors }, setValue, watch } = form;

    const processSubmit = async (data: CourseFormValues) => {
        setIsSubmitting(true);
        const success = await onSubmit(data);
        setIsSubmitting(false);
    };
    */
  // --- End Option 2 ---

  const difficultyLevels = ["Beginner", "Intermediate", "Advanced"];

  return (
    // Choose one handleSubmit: basic 'handleSubmit' or RHF 'handleSubmit(processSubmit)'
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create New Course" : "Edit Course Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              name="title" // Required for basic state management
              // {...register("title")} // RHF registration
              value={formData.title} // Basic state
              onChange={handleInputChange} // Basic state
              placeholder="e.g., Introduction to Kanaka Platform"
              required
              disabled={isSubmitting}
            />
            {/* {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>} RHF error */}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description" // Basic state
              // {...register("description")} // RHF registration
              value={formData.description ?? ""} // Basic state
              onChange={handleInputChange} // Basic state
              placeholder="Provide a detailed overview of the course content..."
              rows={5}
              disabled={isSubmitting}
            />
            {/* {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>} RHF error */}
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              name="difficulty"
              // Use undefined for the Select value prop if the state is null
              value={formData.difficulty ?? undefined}
              onValueChange={handleSelectChange}
              disabled={isSubmitting}
            >
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty..." />
              </SelectTrigger>
              <SelectContent>
                {/* Remove the explicit "None" item */}
                {/* <SelectItem value="">None</SelectItem>  <-- REMOVE THIS */}
                {difficultyLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* {errors.difficulty && <p className="text-sm text-destructive">{errors.difficulty.message}</p>} RHF error */}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              name="source"
              value={formData.source ?? ""}
              onChange={handleInputChange}
              placeholder="e.g., Internal, LinkedIn Learning, Vendor"
              disabled={isSubmitting}
            />
          </div>

          {/* External URL */}
          <div className="space-y-2">
            <Label htmlFor="url">External URL (Optional)</Label>
            <Input
              id="url"
              name="url"
              type="url"
              value={formData.url ?? ""}
              onChange={handleInputChange}
              placeholder="https://learning.example.com/course/123"
              disabled={isSubmitting}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={formData.imageUrl ?? ""}
              onChange={handleInputChange}
              placeholder="https://cdn.example.com/images/course_banner.jpg"
              disabled={isSubmitting}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Comma-separated)</Label>
            <Textarea
              id="tags"
              name="tags"
              value={formData.tags ?? ""}
              onChange={handleInputChange}
              placeholder="e.g., Management, Design, Frontend, Compliance"
              rows={2}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Enter tags separated by commas.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : mode === "create" ? (
              "Create Course"
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
