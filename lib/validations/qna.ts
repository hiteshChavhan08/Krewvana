// lib/validations/qna.ts
import { Value } from "@udecode/plate";
import * as z from "zod";

// Basic validation for Plate.js content (adjust as needed)
// Check if it's an array and not just the default empty paragraph.
// You might need to inspect Plate's output for an empty editor to refine this.
const RichTextContentSchema = z.any().refine(
  (value) => {
    if (!Array.isArray(value)) return false; // Must be an array
    // Example check: is it more than just one empty paragraph block?
    if (value.length > 1) return true; // More than one block is likely content
    if (value.length === 1) {
      const block = value[0];
      // Check if it's a paragraph type (adjust 'p' if needed)
      if (block?.type !== "p") return true; // Different block type has content
      // Check if the paragraph has non-empty text children
      if (
        block.children?.length > 1 ||
        (block.children?.length === 1 && block.children[0]?.text !== "")
      ) {
        return true; // Has multiple children or non-empty text
      }
    }
    return false; // Treat as empty/invalid if it matches the default empty state
  },
  { message: "Content cannot be empty." }
);

// --- Schema for Creating a Question ---
export const CreateQuestionSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters long.")
    .max(150, "Title cannot exceed 150 characters."),
  content: RichTextContentSchema, // Use the refined content schema
  // Tags: array of strings, each 1-25 chars, 1-5 tags total
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty.")
        .max(25, "Tag cannot exceed 25 characters.")
        // Optional: Add regex for allowed characters if needed (e.g., no spaces)
        .regex(
          /^[a-zA-Z0-9+-.]+$/,
          "Tag can only contain letters, numbers, +, -, ."
        )
    )
    .min(1, "Please add at least one tag.")
    .max(5, "You can add a maximum of 5 tags."),
});
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

// --- Schema for Creating an Answer ---
// export const CreateAnswerSchema = z.object({
//   questionId: z.string().cuid('Invalid question ID.'), // Ensure it's a CUID
//   content: RichTextContentSchema, // Use the refined content schema
// });

// export type CreateAnswerInput = z.infer<typeof CreateAnswerSchema>;

// You can add Update schemas later...
// Function to check if Plate value has actual text content
const hasContent = (value: Value): boolean => {
  if (!Array.isArray(value)) return false;
  return value.some((node: any) => {
    if (node.text?.trim()) return true; // Check TText nodes
    if (Array.isArray(node.children)) {
      // Recursively check TElement children
      return hasContent(node.children);
    }
    return false;
  });
};

export const CreateAnswerSchema = z.object({
  content: z
    .custom<Value>() // Use z.custom for complex types
    .refine((value) => hasContent(value), {
      // Use the helper function
      message: "Answer content cannot be empty.",
    }),
  // Removed questionId if it's not part of the form data being submitted directly
});

export type CreateAnswerInput = z.infer<typeof CreateAnswerSchema>;
