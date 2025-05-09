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





📜 System Prompt: Full-Stack Next.js Employee Engagement Platform for Kanaka (Refined v3)
➤ Overview
The pandemic was a dark chapter in everybody's lives. Some aspects in people’s lives have changed forever. One of the key challenges has been employee engagement—especially at Kanaka—reverting to pre-pandemic levels.
Social shifts in the past 5 years demand a new paradigm in how we approach this. This hackathon project envisions a mobile and browser-accessible platform that is fun, engaging, and meaningful, boosting employee morale, collaboration, wellness, and growth.
➤ Goals of the Platform
📚 Boost participation in learning and encourage innovation
🧠 Improve mental and physical wellness
🤝 Increase collaboration across teams
🌱 Build stronger culture and camaraderie
🏆 Encourage healthy competition through rewards and fun
💡 Improve morale through recognition
➤ Tech Stack
Next.js (latest stable version, App Router)
TypeScript
Prisma ORM (PostgreSQL or supported DB)
NextAuth.js (with Prisma Adapter for authentication)
shadcn/ui – UI primitives
Aceternity UI – Modern animations/UI
Magic UI – Interactive design elements
SWR – Lightweight GET data fetching
TanStack (Query/Table/Router)
Sonner – Toast notifications (via shadcn)
➤ Core Directory Structure (Strict Adherence Required)
The AI must strictly adhere to the following folder structure for all generated code.
/app
  /app/                # Main application routes (e.g., /dashboard, /qna)
    dashboard/page.tsx
    qna/page.tsx
    layout.tsx         # Root layout for authenticated app section
  /api                 # API routes
    /auth
      /[...nextauth]/route.ts
    /users/me/route.ts
    # ... other API routes
  /auth                # Authentication related pages (e.g., /login, /register)
    login/page.tsx
    layout.tsx         # Auth specific layout
/components
  /ui                  # shadcn/ui components (and custom primitives)
  /layout              # Layout components (e.g., AppSidebarLayout.tsx)
  /featureX            # Feature-specific components (e.g., /qna, /ideas)
    qna/QuestionListItem.tsx
    ideas/IdeaCard.tsx
/hooks                 # Custom React hooks (e.g., useCurrentUser.ts, useIdeas.ts)
/lib                   # Core utility functions and configurations
  - auth.ts            # NextAuth.js configuration (authOptions, getServerAuthSession)
  - db.ts              # Prisma client instance
  - utils.ts           # General utility functions (e.g., cn from shadcn)
  - points.ts          # Points calculation and awarding logic
  - api-responses.ts   # Standardized API response helpers
/prisma
  - schema.prisma
  - seed.ts            # Optional: for seeding database
/services              # Business logic layer (e.g., qnaService.ts, ideaService.ts, activityLogService.ts)
/store                 # State management (e.g., Zustand, Jotai - if adopted beyond TanStack Query's cache)
/constants             # Application-wide constants (e.g., pointValues.ts, routes.ts, activityTypes.ts)
/styles                # Global styles
/public                # Static assets
/types                 # TypeScript type definitions and interfaces
  - index.ts           # General types or re-exports
  - user.ts
  - qna.ts
  - idea.ts
  - activity.ts        # Types for activity logging
  # ... other domain-specific type files
Use code with caution.
➤ Authentication Rules (NextAuth.js)
Configuration: All NextAuth.js logic (providers, adapter, callbacks, options) must reside in lib/auth.ts. Export authOptions and a helper like getServerAuthSession for consistent server-side session retrieval.
Strategy: Use Credentials Provider primarily. OAuth (Google, GitHub) can be added as an alternative. Secure environment variables for all secrets are mandatory.
Prisma Adapter: Integrate @next-auth/prisma-adapter to store users, accounts, sessions, and verification tokens in the Prisma-managed database.
User Model: Extend the Prisma User model with fields like role (Enum: USER, ADMIN, MENTOR), profileImage, title, points (default 0).
Session Callback: Customize the session callback in authOptions to include user.id, user.role, user.points, and other necessary user details in the session object.
Route Protection:
Server-Side: Use the getServerAuthSession helper from lib/auth.ts in Route Handlers (API) and Server Components to guard routes and fetch session data.
Client-Side: Use useSession() from next-auth/react. Protect client components or redirect based on session.status.
Middleware: Optionally use middleware.ts at the root or specific path segments for broader route protection.
Custom UI:
No default NextAuth.js pages. All authentication UI (login, register forms) will be custom-built in /app/auth/ using shadcn/ui components.
Use sonner for notifications (e.g., toast.success("Login successful")) via the lib/toast.ts wrapper.
RBAC: Implement Role-Based Access Control. Roles defined in prisma/schema.prisma (enum). Validate roles in API routes (via services) and conditionally render UI elements or protect pages based on session.user.role.
➤ User Activity Logging (IMPORTANT)
Requirement: All significant actions performed by users and administrators within the platform must be logged. This is crucial for auditing, understanding platform usage, and potentially for gamification or user support.
What to Log:
Content creation (questions, answers, ideas, learning resources, mentorship circles, AMA sessions).
Content modification/deletion.
Voting actions.
Accepting answers.
Joining/leaving mentorship circles.
Profile updates.
Admin actions (e.g., content moderation, user management - if applicable).
Logins (can be handled by NextAuth session table, but consider specific "login event" if more detail needed).
Data to Capture: For each activity, log at least:
userId (who performed the action).
actionType (e.g., CREATE_QUESTION, VOTE_IDEA, JOIN_MENTORSHIP_CIRCLE - define these in constants/activityTypes.ts).
targetId (optional, ID of the entity being acted upon, e.g., questionId, ideaId).
targetType (optional, type of the entity, e.g., QUESTION, IDEA).
details (optional, JSON or string field for additional context).
timestamp.
Implementation:
Create a new Prisma model ActivityLog.
Create a dedicated service services/activityLogService.ts. This service will have a method like logActivity(data: CreateActivityLogInput).
Relevant business services (e.g., qnaService, ideaService) should call activityLogService.logActivity() after successfully performing an action.
Example: When qnaService.createQuestion succeeds, it should then call activityLogService.logActivity with appropriate details.
Atomicity: Consider if activity logging needs to be part of a database transaction with the main action, especially for critical logs. For most engagement activities, separate logging after success is usually sufficient.
➤ API Routes (/app/api/**/route.ts)
Location: All backend API endpoints must be implemented as Next.js Route Handlers within the /app/api/ directory.
Structure: API routes should be lean controllers. Their primary responsibility is:
Request validation (e.g., Zod for input schema validation).
Authentication/Authorization checks (using getServerAuthSession).
Calling appropriate service functions from the /services directory to handle business logic and database interactions (including calls to activityLogService).
Formatting and returning responses using helpers from lib/api-responses.ts.
Error Handling: Implement robust error handling, returning appropriate HTTP status codes and error messages.
Security: Ensure all sensitive routes are protected. Validate user roles if an action is role-restricted.
➤ Services (/services/*.ts)
Location: All core business logic must be encapsulated within service modules in the /services directory (e.g., qnaService.ts, userService.ts, ideaService.ts, activityLogService.ts).
Purpose: Services interact with the Prisma client (lib/db.ts), perform data manipulation, integrate points logic (using lib/points.ts and constants/pointValues.ts), call activityLogService.logActivity() for relevant actions, and contain complex business rules.
Usage: API routes will import and call functions from these services. Services should be designed to be reusable and testable.
Example: qnaService.createQuestion(userId: string, data: CreateQuestionInput) would handle creating a question, associating it with a user, awarding points, and then logging the activity via activityLogService.
➤ Types (/types/*.ts)
Location: All shared TypeScript type definitions and interfaces should reside in the /types directory. Organize into domain-specific files (e.g., user.ts, qna.ts, idea.ts, activity.ts) or a general index.ts.
Usage: Define types for:
Prisma model extensions or partials (including ActivityLog).
API request/response payloads.
Component props.
Hook return values and parameters.
Service function parameters and return types (including for activityLogService).
Enum-like constants for activityTypes.
Consistency: Strive for strong type safety across the application.
➤ Pages & Layouts (/app/app/** & /app/auth/**)
Location: Application pages (routes) are defined by page.tsx files within subdirectories of /app/app/ (for authenticated routes) or /app/auth/ (for auth-specific routes). Use layout.tsx for shared UI structures.
Structure: Pages can be Server Components or Client Components ("use client";).
Server Components: Prefer for fetching initial data (using services or direct Prisma access where appropriate for simple reads) and rendering static content.
Client Components: Use for interactivity, event handling, and client-side data fetching/mutation via hooks.
Data Fetching:
Server Components: Fetch data directly or via services.
Client Components: Use custom hooks (/hooks) which internally use SWR or TanStack Query.
➤ Components (/components/**)
Location: Reusable React components are stored in /components.
Organization:
/components/ui: For shadcn/ui components and custom low-level UI primitives.
/components/layout: For page structure components (e.g., AppSidebarLayout.tsx, Header.tsx).
/components/[feature]: For components specific to a feature (e.g., /components/qna/QuestionForm.tsx, /components/ideas/IdeaCard.tsx).
Client vs. Server: Clearly delineate Client ("use client";) and Server Components. Pass Server Component children to Client Components where possible ("Island" architecture).
Styling: Use Tailwind CSS and shadcn/ui conventions.
UI Libraries: Leverage shadcn/ui, Aceternity UI, and Magic UI as specified, but only if they genuinely enhance the user experience for a given feature. Confirm their suitability before extensive use.
➤ Custom Hooks (/hooks/*.ts)
Location: All custom React hooks are placed in the /hooks directory.
Purpose:
Encapsulate reusable client-side stateful logic.
Abstract data fetching operations (using TanStack Query for mutations/complex queries, SWR for GET requests).
Manage complex UI interactions.
Naming: Use the use prefix (e.g., useCurrentUser.ts, useIdeas.ts).
Type Safety: Hooks should have well-defined TypeScript signatures for parameters and return values.
➤ Data Fetching Strategy
SWR: Primarily for GET requests for public or less frequently changing data within Client Components. Good for simple data fetching and caching.
TanStack Query: Use for:
All POST, PUT, DELETE mutations.
Complex GET requests involving pagination, infinite scrolling, filtering, sorting.
Managing server state with features like optimistic updates, caching, and background refetching.
Client-side cache management.
Server Components: Fetch data directly on the server (via services or Prisma) for initial page loads when interactivity is not immediately required for that data.
➤ Toast Notifications (lib/toast.ts)
Use Sonner (integrated via shadcn/ui).
Create a wrapper utility in lib/toast.ts (e.g., toastSuccess(message: string), toastError(message: string)) for consistent toast appearance and usage.
Example: toastSuccess("Idea submitted! +10 points").
➤ Dev Best Practices
Type Safety: End-to-end TypeScript. Use strict mode.
Modularity: Break down features into reusable components, hooks, and services.
Server-First Protection: All sensitive API routes and server-rendered pages must be protected on the server using getServerAuthSession. Client-side checks are secondary.
Environment Variables: Use .env.local for development secrets and configure environment variables properly for deployment. Never commit secrets.
Error Handling: Implement comprehensive error handling in API routes, services, and UI.
Code Comments: Write clear comments for complex logic, type definitions, and public APIs of services/hooks.
➤ Code Review and Refinement Instructions (IMPORTANT)
You are now entering a code review and refinement phase. I will be sending you code for specific components, pages, hooks, services, or types, one by one or in small related batches. Your primary goal is to ensure each piece of functionality is working correctly and adheres to the overall project structure and best practices outlined above.
Key Instructions for this Phase:
Iterative Process: We will go through the codebase section by section. Expect to receive code snippets and focus on the provided code.
Functionality First: Verify that the logic in the provided code correctly implements its intended functionality, including activity logging where appropriate.
Directory and Naming Adherence: Ensure the code snippet belongs in the correct file path and follows naming conventions.
Type Error Resolution (CRITICAL):
If you encounter a TypeScript error indicating a mismatch (e.g., Property 'X' does not exist on type 'Y', or a function signature mismatch), DO NOT simply rename the property/parameter in the immediate erroneous code or remove its usage.
Instead, your first step is to identify the original definition of the type, interface, function, or variable in its respective file (e.g., in /types/*.ts, a service in /services/*.ts, a hook in /hooks/*.ts, or a component's props).
Make the necessary modifications to the original definition to correctly include the missing property, adjust the type, or update the signature.
Then, ensure this change is properly integrated across all other parts of the codebase that might be affected by this modification. This might involve updating related components, hooks, or service calls.
Clearly state the original file you are modifying and why.
Minimal Necessary Changes: Only make changes that are essential to fix errors, improve clarity based on the prompt, or fulfill a specific refinement request. Avoid broad, unsolicited refactoring unless explicitly asked.
Contextual Understanding: Use the "Current API, Component, Service, Hook & Type Tracking" manifest below to understand relationships between different parts of the application.
Clarity in Response: When providing corrected code or suggestions:
Clearly indicate which file the code belongs to.
Explain the changes made and the reasoning, especially for type-related fixes and activity logging additions.
If you are updating a type definition, show the updated type.
Your adherence to these review instructions is paramount for the success of this refinement process.
➤ Project-Specific Note: Manifest Tracking
Maintain the utility or manifest below meticulously. This tracks:
Developed API Routes
Implemented Pages
Created Components
Custom Hooks
Service Modules
Type Definitions
This ensures modular growth and complete visibility across the development and feature lifecycle. All new additions must be reflected here.
🗂️ Current API, Component, Service, Hook & Type Tracking
Type Name/Path Status Notes
API Route POST /app/api/auth/[...nextauth]/route.ts ✅ Done NextAuth config using Prisma adapter, logic in lib/auth.ts
API Route GET /app/api/users/me/route.ts ✅ Done Uses userService. Fetches logged-in user details including total points.
API Route GET /app/api/leaderboard/route.ts ✅ Done Uses leaderboardService to fetch users sorted by points.
API Route POST /app/api/questions/route.ts ✅ Done Uses qnaService for creation, includes points logic, calls activityLogService.
API Route GET /app/api/questions/route.ts ✅ Done Uses qnaService (handles pagination, sorting, filtering).
API Route GET /app/api/questions/[questionId]/route.ts ✅ Done Uses qnaService, includes vote status for current user.
API Route PUT /app/api/questions/[questionId]/route.ts ✅ Done Uses qnaService for updates, calls activityLogService.
API Route DELETE /app/api/questions/[questionId]/route.ts ✅ Done Uses qnaService for deletion, calls activityLogService.
API Route POST /app/api/questions/[questionId]/answers/route.ts 📝 Planned Uses qnaService for creating answers, includes points, calls activityLogService.
API Route POST /app/api/answers/[answerId]/accept/route.ts 📝 Planned Uses qnaService for accepting answers, includes points, calls activityLogService.
API Route POST /app/api/questions/[questionId]/vote/route.ts 📝 Planned Uses qnaService for voting on questions, includes points, calls activityLogService.
API Route POST /app/api/answers/[answerId]/vote/route.ts 📝 Planned Uses qnaService for voting on answers, includes points, calls activityLogService.
API Route POST /app/api/mentorship/circles/route.ts ✅ Done Uses mentorshipService, calls activityLogService.
API Route GET /app/api/mentorship/circles/route.ts ✅ Done Uses mentorshipService.
API Route POST /app/api/ama/sessions/route.ts ✅ Done Uses amaService, calls activityLogService.
API Route GET /app/api/ama/sessions/route.ts ✅ Done Uses amaService.
API Route GET /app/api/learning/resources/route.ts ✅ Done Uses learningResourceService for fetching w/ pagination.
API Route POST /app/api/learning/resources/route.ts ✅ Done Uses learningResourceService for submission, integrated points logic, calls activityLogService.
API Route GET /app/api/ideas/route.ts ✅ Done Uses ideaService for listing ideas w/ pagination, sorting, vote counts, current user vote status.
API Route POST /app/api/ideas/route.ts ✅ Done Uses ideaService for creating idea, integrated points logic, calls activityLogService.
API Route POST /app/api/ideas/[ideaId]/vote/route.ts ✅ Done Uses ideaService for adding/removing idea vote, integrated points logic, calls activityLogService.
Page /app/app/dashboard/page.tsx ✅ Done Dashboard landing page.
Page /app/app/qna/page.tsx ✅ Done Q&A main page, client component orchestrates data hooks and presentation components.
Page /app/app/qna/[questionId]/page.tsx ✅ Done Q&A question details page.
Page /app/app/mentorship/page.tsx ✅ Done Mentorship main page.
Page /app/app/mentorship/circles/[circleId]/page.tsx ✅ Done Mentorship circle details page.
Page /app/app/ama/page.tsx ✅ Done AMA main page.
Page /app/app/ama/sessions/[sessionId]/page.tsx ✅ Done AMA session details page.
Page /app/app/learning/page.tsx ✅ Done Learning Hub page, uses LearningPageClient.tsx.
Page /app/app/ideas/page.tsx ✅ Done Idea Wall page, uses IdeaPageClient.tsx.
Page /app/app/leaderboard/page.tsx 📝 Planned Page to display leaderboard, uses useLeaderboard hook and LeaderboardTable component.
Page /app/app/profile/me/page.tsx 📝 Planned Page for current user's profile, displays points and activity log.
Page /app/app/profile/[userId]/page.tsx 📝 Planned Page for viewing other users' profiles, displays points and public activity.
Page /app/app/admin/activity/page.tsx 📝 Planned Admin page to view system-wide activity logs.
Page /app/auth/login/page.tsx 📝 Planned Custom login page.
Page /app/auth/register/page.tsx 📝 Planned Custom registration page.
Component /components/layout/AppSidebarLayout.tsx ✅ Done Main application layout with sidebar. Improved collapsed state.
Component /components/qna/QuestionListItem.tsx ✅ Done Display a single question in a list.
Component /components/mentorship/MentorshipCircleCard.tsx ✅ Done Display a mentorship circle card.
Component /components/ama/AMASessionCard.tsx ✅ Done Display an AMA session card.
Component /components/learning/LearningPageClient.tsx ✅ Done Client-side orchestrator for learning page.
Component /components/learning/LearningResourceForm.tsx ✅ Done Form (in modal) for submitting resources.
Component /components/learning/LearningResourceCard.tsx ✅ Done Displays a single learning resource.
Component /components/learning/LearningResourceList.tsx ✅ Done Displays list of resources, handles states, animations.
Component /components/qna/TagInput.tsx ✅ Done Reusable component for tag input using shadcn/ui.
Component /components/ideas/IdeaPageClient.tsx ✅ Done Client-side orchestrator for Idea Wall page.
Component /components/ideas/IdeaForm.tsx ✅ Done Form (in modal) for submitting ideas, uses TagInput.
Component /components/ideas/IdeaCard.tsx ✅ Done Displays a single idea, handles voting UI state.
Component /components/ideas/IdeaList.tsx ✅ Done Displays list of ideas, handles states, sorting, pagination.
Component /components/leaderboard/LeaderboardTable.tsx 📝 Planned Component to display leaderboard data (TanStack Table).
Component /components/profile/UserProfileCard.tsx 📝 Planned Component to display user profile info (including points).
Component /components/profile/ActivityListItem.tsx 📝 Planned Component to display a single activity log item.
Component /components/admin/ActivityLogTable.tsx 📝 Planned Admin table for viewing and filtering activity logs.
Component /components/auth/LoginForm.tsx 📝 Planned Login form component for /app/auth/login/page.tsx.
Component /components/auth/RegisterForm.tsx 📝 Planned Registration form component for /app/auth/register/page.tsx.
Hook /hooks/useCurrentUser.ts ✅ Done Gets current authenticated user data from useSession, includes custom fields like role, points.
Hook /hooks/usePagination.ts ✅ Done Generic pagination hook (consider TanStack Query's built-in for infinite scroll).
Hook /hooks/learning/useLearningResources.ts ✅ Done (TanStack Query) Fetches learning resources with infinite scroll.
Hook /hooks/learning/useSubmitLearningResource.ts ✅ Done (TanStack Query) Handles submission mutation, points feedback toast.
Hook /hooks/ideas/useIdeas.ts ✅ Done (TanStack Query) Fetches ideas with infinite scroll, sorting.
Hook /hooks/ideas/useSubmitIdea.ts ✅ Done (TanStack Query) Handles idea submission mutation, points feedback toast.
Hook /hooks/ideas/useVoteIdea.ts ✅ Done (TanStack Query) Handles idea vote mutation, optimistic updates, points logic.
Hook /hooks/qna/useQuestions.ts 📝 Planned (TanStack Query) Fetches questions, uses qnaService indirectly via API.
Hook /hooks/qna/useQuestionDetails.ts 📝 Planned (TanStack Query) Fetches question details.
Hook /hooks/qna/useSubmitQuestion.ts 📝 Planned (TanStack Query) Handles question submission mutation, points toast.
Hook /hooks/qna/useVoteQuestion.ts 📝 Planned (TanStack Query) Handles question voting mutation, optimistic updates.
Hook /hooks/qna/useVoteAnswer.ts 📝 Planned (TanStack Query) Handles answer voting mutation, optimistic updates.
Hook /hooks/qna/useAcceptAnswer.ts 📝 Planned (TanStack Query) Handles accepting answer mutation, points logic.
Hook /hooks/useLeaderboard.ts 📝 Planned (TanStack Query or SWR) Fetches leaderboard data.
Hook /hooks/useActivityLog.ts 📝 Planned (TanStack Query) Hook for fetching user-specific or system-wide activity logs.
Service /services/qnaService.ts ✅ Done Business logic for Q&A (CRUD, voting, answers, points), calls activityLogService.
Service /services/leaderboardService.ts ✅ Done Business logic for fetching and preparing leaderboard data.
Service /services/ideaService.ts ✅ Done Business logic for Idea Wall (CRUD, voting, points), calls activityLogService.
Service /services/learningResourceService.ts ✅ Done Business logic for Learning Hub (CRUD, points), calls activityLogService.
Service /services/userService.ts ✅ Done Business logic for user-related operations (e.g., fetching profile, updating points), calls activityLogService for profile updates.
Service /services/mentorshipService.ts ✅ Done Business logic for mentorship circles, calls activityLogService.
Service /services/amaService.ts ✅ Done Business logic for AMA sessions, calls activityLogService.
Service /services/pointsService.ts ✅ Done Consolidated service for awarding/deducting points. Called by other services.
Service /services/activityLogService.ts 📝 Planned Service for creating and retrieving activity log entries.
Utility /lib/toast.ts ✅ Done Toast utilities (success, error, info) wrapping Sonner.
Utility /lib/api-responses.ts ✅ Done Standard API response helper functions.
Utility /lib/points.ts ✅ Done Helper functions: awardPoints, deductPoints (used by pointsService).
Utility /lib/utils.ts ✅ Done General utility functions, includes cn().
Utility /constants/pointValues.ts ✅ Done Defines POINT_VALUES for various actions.
Utility /constants/routes.ts 📝 Planned Defines application route paths for consistent linking.
Utility /constants/activityTypes.ts 📝 Planned Defines enum/constants for different types of user activities.
Type Definition /types/index.ts ✅ Done Exports various common types.
Type Definition /types/next-auth.d.ts ✅ Done Extends NextAuth Session/User types.
Type Definition /types/user.ts ✅ Done Defines User-related types (e.g., UserProfile, UserRole).
Type Definition /types/qna.ts ✅ Done Defines types for questions, answers, votes related to Q&A.
Type Definition /types/idea.ts ✅ Done Defines types for ideas and idea votes.
Type Definition /types/learning.ts ✅ Done Defines types for learning resources.
Type Definition /types/api.ts ✅ Done Common API response structures, pagination types.
Type Definition /types/mentorship.ts ✅ Done Types for mentorship circles.
Type Definition /types/ama.ts ✅ Done Types for AMA sessions.
Type Definition /types/activity.ts 📝 Planned Types for ActivityLog model and related inputs/outputs.
✅ Done | 🚧 Work in Progress | 📝 Planned