// Define this outside the component, or import from e.g., '@/lib/api/qnaApi.ts'
// Ensure the backend API route is POST /api/questions/${questionId}/answers
// and expects { content: Value } in the body.

import { Value } from "@udecode/plate"; // Import Value type if needed elsewhere
import { toast } from "sonner"; // Import toast for error handling here too

// Define the expected input type for the API call
interface PostAnswerPayload {
  questionId: string;
  content: Value; // Plate.js editor content type
}

// Define the expected success response type from the API (adjust as needed)
type PostAnswerResponse = {
  id: string; // ID of the newly created answer
  // Include other fields if the API returns them
};

async function postAnswerApi(
  payload: PostAnswerPayload
): Promise<PostAnswerResponse> {
  const { questionId, content } = payload;
  const apiUrl = `/api/questions/${questionId}/answers`;
  console.log(`[AnswerForm] Posting to: ${apiUrl}`); // Debug log

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Send only the necessary content field in the body, matching backend expectation
    body: JSON.stringify({ content: content }),
  });

  if (!response.ok) {
    let errorMsg = "Failed to post answer.";
    try {
      const errorData = await response.json();
      // Look for specific validation errors or general message
      const validationError =
        errorData.details?.[0]?.message ||
        errorData.errors?.[Object.keys(errorData.errors)[0]]?.[0];
      errorMsg =
        validationError ||
        errorData.error ||
        errorData.message ||
        `Request failed (${response.status})`;
    } catch (e) {
      errorMsg = `Request failed (${response.status})`;
    }
    console.error(`[AnswerForm] API Error (${response.status}): ${errorMsg}`); // Debug log
    throw new Error(errorMsg); // Throw error for useMutation's onError
  }

  console.log("[AnswerForm] API Success"); // Debug log
  return response.json(); // Return the created answer data (or success indicator)
}
