// // components/qna/RichTextRenderer.tsx
// "use client";

// import React from 'react';
// import { Value } from '@udecode/plate';
// import { RichTextEditor } from '@/components/shared/RichTextEditor'; // Reuse the same editor component

// interface RichTextRendererProps {
//   content: Value | null | undefined; // Plate JSON value
// }

// // Default value for rendering if content is empty/invalid
// const emptyContentValue: Value = [{ type: 'p', children: [{ text: '' }] }];

// export function RichTextRenderer({ content }: RichTextRendererProps) {
//   // Ensure content is a valid Plate value array, otherwise use default empty
//   const validContent = Array.isArray(content) && content.length > 0 ? content : emptyContentValue;

//   return (
//     <RichTextEditor
//       value={validContent}
//       onChange={() => {}} // No-op onChange for read-only
//       readOnly={true}
//     />
//   );
// }