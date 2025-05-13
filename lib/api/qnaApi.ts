// Place this outside your component, e.g., at the top of the file
// or preferably in a dedicated API service file like 'lib/api/qnaApi.ts'
// and then import it into answer-form.tsx

import type { Value } from "@udecode/plate"; // Ensure Value type is imported

// Define the expected input type for the API call
interface PostAnswerPayload {
  questionId: string;
  content: Value; // Plate.js editor content type
}

// Define the expected success response type from the API (adjust as needed)
// Example: Assuming the API returns the newly created answer object
type PostAnswerResponse = {
  id: string; // ID of the newly created answer
  content: Value;
  createdAt: string; // Or Date
  authorId: string;
  questionId: string;
  // Include other fields returned by your specific API endpoint
};

/**
 * Sends a new answer to the backend API.
 * @param payload - An object containing questionId and the answer content (Plate Value).
 * @returns The newly created answer data from the API.
 * @throws An error if the API request fails.
 */
export async function postAnswerApi(payload: PostAnswerPayload): Promise<PostAnswerResponse> { // Use specific return type
    const { questionId, content } = payload;

    // Validate input minimally (more robust validation via Zod is in the form)
    if (!questionId || !content) {
        throw new Error("Question ID and answer content are required.");
    }

    // Construct the correct API endpoint URL
    const apiUrl = `/api/questions/${questionId}/answers`; // MAKE SURE THIS MATCHES YOUR ACTUAL API ROUTE

    console.log(`[postAnswerApi] Posting to: ${apiUrl}`); // Debug log

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Include authentication headers if your API requires it
                // e.g., Authorization: `Bearer ${token}`
            },
            // Ensure the body matches what your API endpoint expects
            // Usually just the content field for creating an answer
            body: JSON.stringify({ content: content }),
        });

        console.log(`[postAnswerApi] Response status: ${response.status}`); // Debug log

        // Check if the request was successful
        if (!response.ok) {
            let errorMsg = `Failed to post answer (status: ${response.status})`;
            try {
                // Attempt to parse more specific error from backend
                const errorData = await response.json();
                console.error("[postAnswerApi] API Error Response Body:", errorData); // Log error details
                const validationError = errorData.details?.[0]?.message || errorData.errors?.[Object.keys(errorData.errors)[0]]?.[0];
                errorMsg = validationError || errorData.error || errorData.message || errorMsg;
            } catch (e) {
                // Response body wasn't JSON or parsing failed
                errorMsg = `Request failed (${response.status} ${response.statusText})`;
            }
            throw new Error(errorMsg); // Throw error for useMutation's onError
        }

        // Parse the successful JSON response
        const responseData = await response.json();
        console.log("[postAnswerApi] API Success Response Body:", responseData); // Debug log
        return responseData as PostAnswerResponse; // Return the created answer data

    } catch (error) {
         // Catch potential network errors or errors thrown above
         console.error("[postAnswerApi] Fetch Error:", error);
         // Re-throw the error so useMutation's onError can handle it
         // Ensure it's an Error object for consistent handling
         if (error instanceof Error) {
             throw error;
         } else {
             throw new Error("An unknown error occurred while posting the answer.");
         }
    }
}