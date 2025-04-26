// // components/shared/RichTextEditor.tsx
// "use client";

// import React from 'react';
// import { DndProvider } from 'react-dnd'; // Needed if using plugins like Image that support drag/drop
// import { HTML5Backend } from 'react-dnd-html5-backend';

// import { Plate } from '@udecode/plate/react';

// // Assuming use-create-editor is adjusted or used as-is
// // If you create a specific hook, import that instead.
// import { useCreateEditor } from '@/components/editor/use-create-editor';
// import { Editor, EditorContainer } from '@/components/plate-ui/editor'; // Your Plate UI Editor wrapper
// import { FixedToolbar } from '@/components/plate-ui/fixed-toolbar'; // Your Plate UI Fixed Toolbar
// import { FixedToolbarButtons } from '@/components/plate-ui/fixed-toolbar-buttons'; // Your Plate UI Toolbar Buttons
// import { FloatingToolbar } from '@/components/plate-ui/floating-toolbar'; // Your Plate UI Floating Toolbar
// import { FloatingToolbarButtons } from '@/components/plate-ui/floating-toolbar-buttons'; // Your Plate UI Floating Buttons
// // Import other necessary plate-ui components used by your plugins/editor setup

// interface RichTextEditorProps {
//   value: any; // The Plate JSON value (or initial value if empty)
//   onChange: (newValue: any) => void;
//   readOnly?: boolean;
//   placeholder?: string;
//   className?: string; // Allow passing additional styling
// }

// // Default initial value for an empty editor (ensure it matches useCreateEditor if modified)
// // const defaultInitialValue = [{ type: 'p', children: [{ text: '' }] }];
// // Or use the one from useCreateEditor if kept as is:
// const defaultInitialValue = [{ type: 'h1', children: [{ text: '' }] }]; // Match default from useCreateEditor

// export function RichTextEditor({
//   value,
//   onChange,
//   readOnly = false,
//   placeholder = "Enter content...",
//   className,
// }: RichTextEditorProps) {

//   // Create editor instance using the hook
//   // Pass readOnly state to the hook
//   const editor = useCreateEditor({ readOnly });

//   // Determine the initial/current value to pass to Plate
//   // Handle cases where initial value might be null/undefined from the form
//   const plateValue = value && Array.isArray(value) && value.length > 0 ? value : defaultInitialValue;

//   // Important: Wrap with DndProvider if using features like image uploads or block dragging
//   return (
//     <DndProvider backend={HTML5Backend}>
//       <Plate
//         editor={editor}
//         value={plateValue} // Use the determined value
//         onChange={!readOnly ? onChange : undefined} // Only attach onChange if not read-only
//       >
//         <EditorContainer className={className}>
//           {!readOnly && (
//             <FixedToolbar>
//               <FixedToolbarButtons />
//             </FixedToolbar>
//           )}

//           <Editor
//             readOnly={readOnly}
//             placeholder={readOnly ? '' : placeholder} // Only show placeholder when editable
//             variant="default" // Or your preferred Shadcn variant
//             // size="sm"
//             // Add specific styling if needed
//             className={`min-h-[150px] pt-14 pb-4 px-3 ${readOnly ? 'border-none shadow-none focus:ring-0 p-0 m-0' : ''}`}
//           />

//           {!readOnly && (
//             <FloatingToolbar>
//               <FloatingToolbarButtons />
//             </FloatingToolbar>
//           )}
//            {/* Remove SettingsDialog unless needed here */}
//            {/* <SettingsDialog /> */}
//         </EditorContainer>
//       </Plate>
//     </DndProvider>
//   );
// }