// app/mentorship/_components/propose-circle.tsx
"use client"; // This component needs client-side interactivity

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// import { useToast } from "@/components/ui/use-toast"; // For showing feedback
import { useRouter } from "next/navigation"; // To potentially refresh data
import { toast } from "sonner";
// Add the points constant here or import from a shared config
const POINTS_FOR_PROPOSING_CIRCLE = 15;
// Define the schema based on API expectation
const proposeCircleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  skillId: z.string().min(1, "Please select a skill"), // Ensure skill is selected
  maxMentees: z.coerce.number().int().positive().optional().nullable(), // Coerce to number, allow empty
});

type ProposeCircleFormData = z.infer<typeof proposeCircleSchema>;

// Type for skill data fetched from API
type Skill = {
  id: string;
  name: string;
};

export function ProposeCircle() {
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter(); // Get router instance

  const {
    register,
    handleSubmit,
    reset,
    control, // Needed for Shadcn Select integration with RHF
    formState: { errors },
  } = useForm<ProposeCircleFormData>({
    resolver: zodResolver(proposeCircleSchema),
    defaultValues: {
      title: "",
      description: "",
      skillId: "",
      maxMentees: null, // Default to null or a sensible number like 3?
    },
  });

  // Fetch skills when the dialog is about to open or is open
  useEffect(() => {
    if (open) {
      setIsLoadingSkills(true);
      fetch("/api/mentorship/skills")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch skills");
          return res.json();
        })
        .then((data: Skill[]) => {
          setSkills(data);
          setIsLoadingSkills(false);
        })
        .catch((error) => {
          console.error("Error fetching skills:", error);
          toast.error("Could not load skills. Please try again later.");
          setIsLoadingSkills(false);
          // Consider closing the dialog or showing error state within
        });
    }
  }, [open, toast]);

  const onSubmit: SubmitHandler<ProposeCircleFormData> = async (data) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Proposing circle...");
    try {
      const response = await fetch("/api/mentorship/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const newCircle = await response.json();

      toast.success(`Circle "${responseData.title}" proposed!`, {
        description: `You earned ${POINTS_FOR_PROPOSING_CIRCLE} points! 🎉`, // Add points info
        id: toastId,
      });
      setOpen(false); // Close the dialog
      reset(); // Reset form fields
      router.refresh(); // Refresh server components on the page to show the new circle
    } catch (error: any) {
      console.error("Failed to propose circle:", error);
      toast.error(`Proposal Failed: ${error.message || "Please try again."}`, {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Propose a Circle</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        {" "}
        {/* Adjust width */}
        <DialogHeader>
          <DialogTitle>Propose a Mentorship Circle</DialogTitle>
          <DialogDescription>
            Offer to mentor others on a specific skill or tool. Fill in the
            details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title *
            </Label>
            <div className="col-span-3">
              <Input
                id="title"
                {...register("title")}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <div className="col-span-3">
              <Textarea
                id="description"
                {...register("description")}
                placeholder="What will mentees learn? What's the format?"
              />
              {/* No error display for optional field usually */}
            </div>
          </div>

          {/* Skill */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="skillId" className="text-right">
              Skill/Topic *
            </Label>
            <div className="col-span-3">
              {/* Shadcn Select integration with react-hook-form */}
              <Select
                onValueChange={(value) => (control._formValues.skillId = value)} // Manually set RHF value
                defaultValue={control._defaultValues.skillId} // Use default value from RHF
                disabled={isLoadingSkills}
                {...register("skillId")} // Register is still needed for validation trigger
              >
                <SelectTrigger
                  id="skillId"
                  className={errors.skillId ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={
                      isLoadingSkills ? "Loading skills..." : "Select a skill"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {!isLoadingSkills &&
                    skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  {!isLoadingSkills && skills.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">
                      No skills available.
                    </div>
                  )}
                  {isLoadingSkills && (
                    <div className="p-2 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.skillId && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.skillId.message}
                </p>
              )}
            </div>
          </div>

          {/* Max Mentees */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxMentees" className="text-right">
              Max Mentees
            </Label>
            <div className="col-span-3">
              <Input
                id="maxMentees"
                type="number"
                min="1"
                {...register("maxMentees")}
                placeholder="Optional (e.g., 3)"
                className={errors.maxMentees ? "border-red-500" : ""}
              />
              {errors.maxMentees && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.maxMentees.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingSkills}>
              {isSubmitting ? "Submitting..." : "Propose Circle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
