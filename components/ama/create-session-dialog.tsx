// components/ama/create-session-dialog.tsx (Create this new file)
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // For DateTime Picker
import { Calendar } from "@/components/ui/calendar"; // For Date part
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // For Host selection
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils"; // For className merging
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- Define User Type for Host Selection ---
type SimpleUser = {
  id: string;
  name: string | null;
  email: string | null; // For display fallback
};

// --- Zod Schema using preprocess for isTechSpecific ---
const createSessionSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters").max(150),
    description: z.string().max(1000).optional(),
    scheduledAt: z
      .date({ required_error: "Please select a date and time" })
      .min(new Date(Date.now() + 5 * 60 * 1000), {
        message: "Schedule at least 5 minutes in the future",
      }),
    hostId: z.string().cuid({ message: "Please select a host" }),

    // Define as strictly boolean - no optional, no default *in Zod*
    isTechSpecific: z.boolean(),

    topic: z.string().max(50).optional(),
  })
  .refine(
    (data) =>
      !data.isTechSpecific ||
      (data.isTechSpecific && data.topic && data.topic.trim().length > 0),
    {
      message: "A topic is required for tech-specific AMAs",
      path: ["topic"],
    }
  );
// --- End Schema Modification ---

type CreateSessionFormData = z.infer<typeof createSessionSchema>;

// --- Component Props ---
interface CreateSessionDialogProps {
  triggerButton?: React.ReactNode; // Allow custom trigger
}

// --- Component ---
export function CreateSessionDialog({
  triggerButton,
}: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableHosts, setAvailableHosts] = useState<SimpleUser[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const router = useRouter();

  // --- Form Hook ---
  const {
    register,
    handleSubmit,
    reset,
    control, // Needed for Controller components (Calendar, Select)
    watch, // Need to watch 'isTechSpecific'
    formState: { errors },
  } = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      title: "",
      description: "",
      scheduledAt: undefined, // Start with no date selected
      hostId: "",
      isTechSpecific: false,
      topic: "",
    },
  });

  const isTechSpecific = watch("isTechSpecific"); // Watch the checkbox state

  // --- Fetch Available Hosts (Example) ---
  // In a real app, this might be a dedicated API endpoint or based on roles
  useEffect(() => {
    if (open) {
      // Fetch only when dialog opens
      setLoadingHosts(true);
      // Replace with your actual API call to get users who can be hosts
      fetch("/api/users?role=host&limit=100") // Example placeholder API
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch hosts");
          return res.json();
        })
        .then((data: SimpleUser[]) => {
          // Assuming API returns SimpleUser[]
          setAvailableHosts(data);
        })
        .catch((err) => {
          console.error("Error loading hosts:", err);
          toast.error("Could not load potential hosts.");
          // Maybe disable host selection or show error
        })
        .finally(() => setLoadingHosts(false));
    }
  }, [open]);

  // --- Submit Handler ---
  const onSubmit: SubmitHandler<CreateSessionFormData> = async (data) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Creating AMA session...");

    // Ensure topic is null if not tech specific before sending
    const payload = {
      ...data,
      topic: data.isTechSpecific ? data.topic : null,
    };

    try {
      const response = await fetch("/api/ama/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();

      if (!response.ok) {
        // Attempt to parse Zod errors if available
        const errorMessages = responseData.errors
          ? Object.entries(responseData.errors)
              .map(
                ([field, messages]) =>
                  `${field}: ${(messages as { _errors: string[] })._errors.join(
                    ", "
                  )}`
              )
              .join("; ")
          : responseData.message || `Error ${response.status}`;
        throw new Error(errorMessages);
      }

      toast.success("AMA Session created successfully!", { id: toastId });
      setOpen(false);
      reset();
      router.refresh(); // Refresh the main AMA page list
    } catch (error: any) {
      console.error("Failed to create session:", error);
      toast.error(`Creation failed: ${error.message || "Please try again."}`, {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- JSX ---
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton ? triggerButton : <Button>+ Create AMA Session</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New AMA Session</DialogTitle>
          <DialogDescription>
            Schedule a new Ask Me Anything session. Select a host and set the
            details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} rows={3} />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Scheduled At (DateTime Picker - simplified example using Calendar) */}
          {/* A proper datetime picker component would be better here */}
          <div className="space-y-1">
            <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
            <Controller
              name="scheduledAt"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                        errors.scheduledAt && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP p")
                      ) : (
                        <span>Pick date and time</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    {/* NOTE: This only selects DATE. You need time input too! */}
                    {/* Consider library like react-datetime-picker or Shadcn extensions */}
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange} // Pass selected date back to RHF
                      disabled={(date) =>
                        date < new Date(Date.now() - 24 * 60 * 60 * 1000)
                      } // Disable past dates
                      initialFocus
                    />
                    {/* Placeholder for Time Input */}
                    <div className="p-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Time selection needed (add input).
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.scheduledAt && (
              <p className="text-xs text-red-600">
                {errors.scheduledAt.message}
              </p>
            )}
            {!errors.scheduledAt && (
              <p className="text-xs text-muted-foreground">
                Requires separate time input implementation.
              </p>
            )}
          </div>

          {/* Host Selection */}
          <div className="space-y-1">
            <Label htmlFor="hostId">Host *</Label>
            <Controller
              name="hostId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value} // Controlled component
                  disabled={loadingHosts}
                >
                  <SelectTrigger
                    id="hostId"
                    aria-invalid={!!errors.hostId}
                    className={errors.hostId ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={
                        loadingHosts ? "Loading hosts..." : "Select a host"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!loadingHosts &&
                      availableHosts.map((host) => (
                        <SelectItem key={host.id} value={host.id}>
                          {host.name ?? host.email ?? host.id}
                        </SelectItem>
                      ))}
                    {!loadingHosts && availableHosts.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        No hosts found.
                      </div>
                    )}
                    {loadingHosts && (
                      <div className="p-2 text-sm text-muted-foreground">
                        Loading...
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.hostId && (
              <p className="text-xs text-red-600">{errors.hostId.message}</p>
            )}
          </div>

          {/* Tech Specific Toggle */}
          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="isTechSpecific"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="isTechSpecific"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label
              htmlFor="isTechSpecific"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Tech-Specific AMA?
            </Label>
          </div>

          {/* Topic (Conditional) */}
          {isTechSpecific && (
            <div className="space-y-1 pl-2">
              {" "}
              {/* Indent slightly */}
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                {...register("topic")}
                aria-invalid={!!errors.topic}
              />
              {errors.topic && (
                <p className="text-xs text-red-600">{errors.topic.message}</p>
              )}
            </div>
          )}

          <DialogFooter className="pt-4">
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
            <Button type="submit" disabled={isSubmitting || loadingHosts}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
