// hooks/learning/useSubmitLearningResource.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LearningResourceCreateData } from "@/lib/schemas";

// Define the expected shape of the created resource, including submittedBy
interface CreatedLearningResource {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  submittedAt: string;
  submittedById: string;
  submittedBy: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  // Add any other fields returned by your API
}

async function submitLearningResourceAPI(
  data: LearningResourceCreateData
): Promise<CreatedLearningResource> {
  const res = await fetch("/api/learning/resources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.details?.[0]?.message ||
        errorData.error ||
        "Failed to submit resource"
    );
  }
  return res.json();
}

export function useSubmitLearningResource() {
  const queryClient = useQueryClient();

  return useMutation<
    CreatedLearningResource,
    Error,
    LearningResourceCreateData
  >({
    mutationFn: submitLearningResourceAPI,
    onSuccess: (newResource) => {
      toast.success("Resource Submitted!", {
        description: "Thanks for sharing!",
      });
      // Invalidate and refetch to show the new resource
      queryClient.invalidateQueries({ queryKey: ["learningResources"] });

      // Optionally, you can optimistically update the cache if you prefer
      // queryClient.setQueryData<InfiniteData<PaginatedLearningResources>>(['learningResources'], (oldData) => {
      //   if (!oldData) return oldData;
      //   const newData = { ...oldData };
      //   // Add to the beginning of the first page's data
      //   if (newData.pages[0]) {
      //       newData.pages[0].data = [newResource, ...newData.pages[0].data];
      //   }
      //   return newData;
      // });
    },
    onError: (error: Error) => {
      toast.error("Submission Failed", { description: error.message });
    },
  });
}
