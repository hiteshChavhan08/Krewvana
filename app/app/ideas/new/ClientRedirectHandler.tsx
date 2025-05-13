// /app/app/ideas/new/ClientRedirectHandler.tsx
"use client";

import React from "react";
import { IdeaForm } from "@/components/ideas/IdeaForm"; // Adjust import path
import { useSubmitIdea } from "@/hooks/ideas/useSubmitIdea"; // Import the mutation hook
import { IdeaUnifiedFormData, IdeaCreateAPIData } from "@/lib/schemas"; // Import necessary types
import { useRouter } from "next/navigation"; // Use navigation router
import { toastError } from "@/utils/toast";

export function ClientRedirectHandler() {
  const router = useRouter();
  const submitMutation = useSubmitIdea(); // Hook to call the POST /api/ideas endpoint

  const handleFormSubmit = (formData: Partial<IdeaUnifiedFormData>) => {
    if (!formData.title || !formData.description) {
      console.error("Form data missing required fields", formData);
      toastError("Title and Description are required.");
      return;
    }

    const apiPayload: IdeaCreateAPIData = {
      title: formData.title,
      description: formData.description,
      category: formData.category || [], // Ensure category is an array
    };

    submitMutation.mutate(apiPayload, {
      onSuccess: (newlyCreatedIdea) => {
        // Redirect upon successful submission
        // Option 1: Redirect to the new idea's detail page'
        if (newlyCreatedIdea?.id) {
          console.log(`Redirecting to /app/ideas/${newlyCreatedIdea.id}`);
          router.push(`/app/ideas/${newlyCreatedIdea.id}`);
        } else {
          console.error(
            "Submission successful, but ID missing in response!",
            newlyCreatedIdea
          );
          toastError(
            "Idea created, but failed to redirect. Please check the ideas list."
          );
          router.push("/app/ideas"); // Fallback redirect
        }

        // Option 2: Redirect back to the main ideas list
        // router.push('/app/ideas');

        // Option 3: Redirect back and show a success message (might need state management or query params)
        // router.push('/app/ideas?submitted=true');
      },
    //   onError: (error) => {
    //     // Error toast is likely handled within useSubmitIdea hook already
    //     console.error(
    //       "Submission successful, but ID missing in response!",
    //       newlyCreatedIdea
    //     );
    //     toastError(
    //       "Idea created, but failed to redirect. Please check the ideas list."
    //     );
    //     router.push("/app/ideas"); // Fallback redirect
    //   },
    });
  };

  return (
    <IdeaForm
      onSubmissionComplete={handleFormSubmit}
      isEditing={false} // Explicitly set to false for creation
      // No existingIdea is passed for creation
    />
  );
}
