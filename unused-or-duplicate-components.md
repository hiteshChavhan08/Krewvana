# Unused or Duplicate Components and Pages

## Potentially Unused Components
1. **`components/ama/session-skeleton.tsx`**
   - `SessionDetailSkeleton` might not be referenced elsewhere.

2. **`components/ama/ama-page-client.tsx`**
   - Contains commented-out code and might not be actively used.

3. **`components/ama/ama-question-input.tsx`**
   - Verify if `AmaQuestionInput` is used in any parent component.

4. **`components/plate-ui/block-selection.tsx`**
   - `BlockSelection` might not be referenced in other files.

5. **`components/plate-ui/column-group-element.tsx`**
   - Contains SVG paths; verify if `ThreeColumnOutlined` is used.

6. **`components/plate-ui/comment-leaf.tsx`**
   - `CommentLeaf` might not be used in the discussions feature.

7. **`components/plate-ui/code-block-element-static.tsx`**
   - Verify if this static version of the code block is used.

## Functions Created Multiple Times
1. **`getInitials`**
   - Found in multiple files, such as `components/circle-card.tsx` and `components/member-list.tsx`.
   - Consolidate into a shared utility file.

2. **`formatShortDate`**
   - Found in `components/circle-card.tsx` and `components/ama/question-list.tsx`.
   - Move to a shared date utility file.

3. **`cn`**
   - Used in almost every component for class name concatenation.
   - Ensure it is imported from a single shared utility file.

4. **`useFakeCurrentUserId` and `useFakeUserInfo`**
   - Found in `components/plate-ui/comment.tsx` and `components/plate-ui/block-discussion.tsx`.
   - Consolidate into a shared mock utility file.

5. **`insertBlock`**
   - Found in `components/plate-ui/slash-input-element.tsx` and `components/plate-ui/insert-dropdown-menu.tsx`.
   - Move to a shared editor utility file.

6. **`useEditorRef`**
   - Found in multiple editor-related components.
   - Ensure it is imported from a single shared editor utility file.

## Suggested Actions
- Consolidate duplicate functions into shared utility files (e.g., `utils/helpers.ts`, `utils/date-helpers.ts`, `utils/editor-helpers.ts`).
- Refactor components to import these shared functions instead of redefining them.

