// components/qna/QuestionForm.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Shadcn UI Form Imports
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

// Plate Imports
import { Plate, PlateContent } from '@udecode/plate/react';
import { Value } from '@udecode/plate';
import { useCreateEditor } from '@/components/editor/use-create-editor'; // Continue using your hook for plugins/config
import { FixedToolbar } from '@/components/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/plate-ui/fixed-toolbar-buttons';
import { FloatingToolbar } from '@/components/plate-ui/floating-toolbar';
import { FloatingToolbarButtons } from '@/components/plate-ui/floating-toolbar-buttons';
// Make sure Editor and EditorContainer are not needed directly here if PlateContent is used

// Custom Components
import { TagInput } from '@/components/qna/tag-input';

// Zod schema for validation
const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long').max(200),
  // Use z.custom for Plate value, add refine for better empty check
  content: z.custom<Value>().refine((value) => {
    // Example: Check if it's not just the default empty block or initial value
    // This check might need adjustment based on your actual default block type ('p', 'h1', etc.)
    return value && value.length > 0 && !(value.length === 1 && value[0].children[0].text === '');
  }, { message: "Question content cannot be empty." }),
  tags: z.array(z.string().min(1).max(50)).min(1, 'At least one tag is required').max(5),
});

type QuestionFormData = z.infer<typeof formSchema>;

// Define the default value structure for the editor based on your useCreateEditor hook
const defaultEditorValue: Value = [{ type: 'h1', children: [{ text: '' }] }]; // Or 'p' if that's your default

export function QuestionForm() {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Create editor instance using the hook (provides plugins/components)
  // You might pass readOnly: isSubmitting if needed
  const editor = useCreateEditor({});

  // 2. Create the form instance using react-hook-form and Zod validation
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: defaultEditorValue, // Initialize content field
      tags: [],
    },
    mode: 'onChange', // Optional: enable validation on change
  });

  const onSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true);
    console.log("Submitting data:", JSON.stringify(data.content)); // Good for debugging Plate content

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content, // Send Plate.js JSON from form data
          tags: data.tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        let errorMessage = errorData.message || 'Failed to submit question';
        if (Array.isArray(errorData) && errorData[0]?.message) {
            errorMessage = errorData.map((e: any) => e.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      const newQuestion = await response.json();
      toast.success("Success!", {description: "Your question has been posted." });
      form.reset({ title: '', content: defaultEditorValue, tags: [] }); // Reset form
      router.push(`/app/qna/${newQuestion.id}`);

    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error("Submission Error", {description: error.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Provide the form context using Shadcn's Form component
    <Form {...form}>
      {/* DndProvider should wrap the part of the form using drag/drop features,
          often just the Plate editor itself or the whole form if needed elsewhere */}
      <DndProvider backend={HTML5Backend}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-screen w-full p-4">

          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., How to integrate Prisma with Next.js App Router?" {...field} />
                </FormControl>
                <FormMessage /> {/* Displays validation errors for 'title' */}
              </FormItem>
            )}
          />

          {/* Content Field (Plate Editor) */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => ( // field contains value, onChange, onBlur, name, ref
              <FormItem>
                <FormLabel>Detailed Question</FormLabel>
                <FormControl>
                  {/* Plate component setup */}
                  <Plate
                    editor={editor}
                    // Use initialValue to set the editor's content from the form state
                    // Plate manages its internal state but syncs via onChange
                    // initialValue={field.value}
                    // size="md"
                    onChange={({value}: {value :Value}) => {
                        // Sync editor changes back to the react-hook-form state
                        field.onChange(value);
                    }}
                  >
                    {/* Add a wrapper for borders and positioning toolbars */}
                    <div className="relative rounded-md border border-input bg-background w-full max-w-full overflow-x-hidden">
                       {/* Position toolbars inside Plate, but outside PlateContent */}
                       {/* <FixedToolbar className="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
                           <FixedToolbarButtons />
                       </FixedToolbar> */}

                       <PlateContent
                           // Pass placeholder and other props directly to PlateContent
                           placeholder="Write your question details here..."
                           className="px-3 py-2 min-h-[200px] focus-visible:outline-none" // Adjusted padding/min-height
                       />

                       {/* <FloatingToolbar>
                           <FloatingToolbarButtons />
                       </FloatingToolbar> */}
                    </div>
                  </Plate>
                </FormControl>
                <FormMessage /> {/* Displays validation errors for 'content' */}
              </FormItem>
            )}
          />

          {/* Tags Field */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (up to 5)</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value} // Pass form field value to TagInput
                    // Ensure TagInput's onChange provides string[]
                    onChange={(newTags: string[]) => field.onChange(newTags)}
                    // You can add error styling based on formState if needed
                    // className={form.formState.errors.tags ? 'border-red-500' : ''}
                  />
                </FormControl>
                <FormMessage /> {/* Displays validation errors for 'tags' */}
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting || !form.formState.isDirty || !form.formState.isValid}>
            {isSubmitting ? 'Submitting...' : 'Post Your Question'}
          </Button>
        </form>
      </DndProvider>
    </Form>
  );
}