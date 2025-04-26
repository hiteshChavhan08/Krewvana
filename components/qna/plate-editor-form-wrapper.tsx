// components/qna/plate-editor-form-wrapper.tsx
'use client';

import React from 'react';
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type {  Value } from '@udecode/plate'; // Correct type import
import type { PlateEditor } from '@udecode/plate/react';
import { Plate } from '@udecode/plate/react'; // Plate component for context/onChange

import { cn } from '@/lib/utils';
// --- Import the specific UI components used in your example ---
// Make sure these paths are correct for your project structure
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
// You might still need Toolbars depending on how EditorContainer/Editor are built
import { FixedToolbar } from '@/components/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/plate-ui/fixed-toolbar-buttons';
// ---

// Define valid variant types based on your Editor component's props
// Check components/plate-ui/editor.tsx for the exact allowed types
type EditorVariant = "select" | "none" | "default" | "ai" | "aiChat" | "comment" | "demo" | "fullWidth" | undefined;

interface PlateEditorFormWrapperProps<TFormValues extends FieldValues> {
  editor: PlateEditor; // Receive editor instance created in parent form
  field: ControllerRenderProps<TFormValues, Path<TFormValues>>; // For value/onChange sync
  placeholder?: string;
  className?: string; // Apply className to the EditorContainer for layout
  editorVariant?: EditorVariant; // Pass the desired variant for the internal Editor
}

export function PlateEditorFormWrapper<TFormValues extends FieldValues>({
  editor,
  field,
  placeholder = 'Type your content...',
  className, // This will be applied to EditorContainer
  editorVariant = 'default' // Use 'default' or another valid variant from your Editor component
}: PlateEditorFormWrapperProps<TFormValues>) {

  // Editor instance is created in the parent form component (e.g., AskQuestionPage) using useCreateEditor

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Use Plate component for context, value management, and onChange handling */}
      <Plate
        editor={editor}
        // initialValue={field.value} // Set initial value from form state
        onChange={({ value }) => {
          // Sync editor value changes back to the react-hook-form field state
          field.onChange(value);
        }}
      >
        {/* Use the EditorContainer structure from your example */}
        {/* Apply className prop here for layout control */}
        <EditorContainer
            className={cn(
                'rounded-md border border-input', // Add base styling
                'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2', // Add focus ring
                className // Apply passed className
            )}
            // Pass other props to EditorContainer if necessary
        >
          {/* Include Toolbar if it's part of your standard editor setup */}
          <FixedToolbar>
              <FixedToolbarButtons />
              {/* Toolbar buttons usually rely on Plate context */}
          </FixedToolbar>

          {/* Render the actual editor area using your styled Editor component */}
          <Editor
            // Pass necessary props defined by your Editor component
            variant={editorVariant} // Use the controlled variant
            placeholder={placeholder}
            // Add styling for the editable area itself (padding, min-height)
            className="min-h-[150px] w-full resize-none px-3 py-2 focus:outline-none"
            focused={false} // Disable Plate's ring if container handles it
            // Value and onChange are handled by the parent <Plate> component
            // The Editor component uses the context provided by <Plate>
          />
        </EditorContainer>
        {/* SettingsDialog is omitted as it's likely specific to the example, not the form wrapper */}
      </Plate>
    </DndProvider>
  );
}