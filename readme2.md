Okay, let's break down the functionalities, corresponding UI elements/sections, and the API endpoints needed, categorized by the `USER` and `ADMIN` roles.

**Access Control Enforcement:**

* **API Routes:** Will check the session (`getServerSession` or equivalent) and the `session.user.role` before performing actions or returning data. Unauthorized or forbidden requests will return 401/403 errors.
* **Frontend UI:** Will use the `useSession` hook to conditionally render components (like admin buttons/sections) or disable actions based on `session.user.role`.

---

**Role: `USER` (Standard Employee)**

* **Core Permissions:** Participate in platform activities, view public content, manage own profile.
* **Default Role:** Assigned automatically on signup/first login.

| Functionality                      | UI Components / Sections                     | Associated API Endpoints (Requires Auth)         | Method | Notes                                    |
| :--------------------------------- | :------------------------------------------- | :----------------------------------------------- | :----- | :--------------------------------------- |
| **Authentication**                 |                                              |                                                  |        | Handled by NextAuth                      |
| Log In                             | `/auth/signin` Page (Shadcn Form)            | `POST /api/auth/callback/[provider]`             | POST   | Via Credentials, Google, etc.            |
| Log Out                            | Logout Button (Navbar/Dropdown)              | `POST /api/auth/signout`                         | POST   | Redirects after logout                   |
| View Session                       | `useSession` hook                            | `GET /api/auth/session`                          | GET    | Used globally for auth state             |
| **Dashboard**                      |                                              |                                                  |        |                                          |
| View Personal Summary              | `/app` (Dashboard Page) - Shadcn Cards       | `GET /api/users/me`                              | GET    | Fetches points, maybe recent badges      |
| Quick Access to Actions            | `/app` - Buttons/Links                       | *(Links to other pages/triggers modals)*           | N/A    | e.g., "Give Kudos" button                |
| **Kudos**                          |                                              |                                                  |        |                                          |
| View Kudos Feed                    | `/app/kudos` (Page) - List/Cards/Table       | `GET /api/kudos`                                 | GET    | Fetches list of recent kudos             |
| Give Kudos                         | "Give Kudos" Button -> Shadcn Dialog/Form    | `POST /api/kudos`                                | POST   | Sends receiverId, message                |
| Search Users (for giving Kudos)    | Autocomplete Input (Shadcn Command) in Form  | `GET /api/users?search=[query]`                  | GET    | Fetches users matching query             |
| **Leaderboard**                    |                                              |                                                  |        |                                          |
| View Leaderboard                   | `/app/leaderboard` (Page) - Shadcn Table     | `GET /api/leaderboard`                           | GET    | Fetches ranked list of users by points   |
| **Profile**                        |                                              |                                                  |        |                                          |
| View Own Profile                   | `/app/profile/me` (Page) - Cards/Info Display | `GET /api/users/me`                              | GET    | Shows points, badges, basic info         |
| *(Future)* Update Profile Info      | `/app/profile/me` - Edit Form                | `PUT /api/users/me`                              | PUT    | Update name, avatar etc.                 |
| **Badges**                         |                                              |                                                  |        |                                          |
| View Own Badges                    | `/app/profile/me` (Badge display component)  | `GET /api/users/me` (includes badges)            | GET    | Badges earned by the user                |
| *(Logic - Backend)* Earn Badges     | *(Triggered by actions like giving Kudos)*    | *(Part of `POST /api/kudos` etc. logic)*         | N/A    | Checks criteria, creates `UserBadge` entry |

---

**Role: `ADMIN` (Platform Administrator)**

* **Core Permissions:** All `USER` permissions + User Management, Content Moderation (basic).
* **Assignment:** Manually assigned (e.g., via DB update, seed script, or future admin UI).

* **Includes ALL `USER` functionalities, UI, and Endpoints above.**

| Functionality (Admin Specific)     | UI Components / Sections                        | Associated API Endpoints (Requires ADMIN Role) | Method | Notes                                           |
| :--------------------------------- | :---------------------------------------------- | :----------------------------------------------- | :----- | :---------------------------------------------- |
| **Admin Access**                   |                                                 |                                                  |        |                                                 |
| Access Admin Area                  | Link/Button to Admin Section (Conditional UI)   | *(Client-side route protection based on role)*    | N/A    | Link only visible if `session.user.role === 'ADMIN'` |
| **User Management**                |                                                 |                                                  |        |                                                 |
| View All Users                     | `/app/admin/users` (Page) - Shadcn Table        | `GET /api/admin/users`                           | GET    | Fetches list of all users with roles            |
| Change User Role                   | Dropdown/Select in User Table Row (`/app/admin/users`) | `PUT /api/admin/users/[userId]`                  | PUT    | Body includes `{ role: 'USER'/'ADMIN' }`        |
| Deactivate/Reactivate User         | Button/Toggle in User Table Row (`/app/admin/users`) | `PUT /api/admin/users/[userId]/status`           | PUT    | Body includes `{ active: true/false }` (Needs DB field) |
| *(Future)* Invite Users            | Invite Form/Button (`/app/admin/users`)         | `POST /api/admin/invites`                        | POST   | Generates invite link/sends email             |
| **Content Management**             |                                                 |                                                  |        |                                                 |
| Delete Kudos                       | Delete Button on Kudos items (Conditional UI)   | `DELETE /api/kudos/[kudosId]`                    | DELETE | Requires Admin role check in API handler        |
| *(Future)* Manage Badges            | `/app/admin/badges` (Page) - Form/Table       | `GET /api/admin/badges` <br/> `POST /api/admin/badges` <br/> `PUT /api/admin/badges/[badgeId]` <br/> `DELETE /api/admin/badges/[badgeId]` | CRUD   | Define/edit available badges                    |
| *(Future)* Manage Platform Settings | `/app/admin/settings` (Page) - Forms          | `GET /api/admin/settings` <br/> `PUT /api/admin/settings` | GET/PUT | Point values, feature flags, etc.            |
| *(Future)* View Analytics         | `/app/admin/analytics` (Page) - Charts/Stats  | `GET /api/admin/analytics/engagement` etc.       | GET    | Aggregate platform usage data                 |

---

This breakdown should provide a clear map for development, showing what needs to be built, where it lives in the UI, which API calls support it, and who has permission to access it. Remember to implement the role checks rigorously in both the frontend (for UI visibility) and backend (for API security).

You're welcome! And absolutely right – the goal is to eventually create a platform that addresses *all six* objectives. While the initial MVP might focus on a subset (like Recognition & Competition) to demonstrate core value quickly, a comprehensive plan should map out how the other goals will be integrated.

Let's expand the previous breakdown to include functionalities, UI, and endpoints covering all six goals, keeping the USER/ADMIN roles in mind. Features marked with `(MVP Focus)` are likely the ones you'd build first, while others represent subsequent additions.

---

**Role: `USER` (Standard Employee)**

| Goal Addressed                     | Functionality                          | UI Components / Sections                             | Associated API Endpoints (Requires Auth)         | Method | Notes                                                      |
| :--------------------------------- | :------------------------------------- | :--------------------------------------------------- | :----------------------------------------------- | :----- | :--------------------------------------------------------- |
| **(All)**                          | **Authentication & Basic Profile**     | *(Same as previous table)*                           | *(Same as previous table)*                       |        | Log In, Log Out, View Session, View Own Profile            |
| **1. Learning & Innovation**       | View Learning Resources                | `/app/learning` - Resource List/Cards                | `GET /api/learning/resources`                    | GET    | See shared articles, videos, courses                       |
|                                    | Suggest Learning Resource              | `/app/learning` - "Suggest Resource" Form/Dialog     | `POST /api/learning/resources`                   | POST   | Submit a link/description (maybe needs admin approval)     |
|                                    | View Innovation Ideas                  | `/app/innovation` - Idea Board/List                  | `GET /api/ideas`                                 | GET    | See ideas submitted by others                              |
|                                    | Submit Innovation Idea                 | `/app/innovation` - "Submit Idea" Form/Dialog        | `POST /api/ideas`                                | POST   | Submit new ideas (points awarded)                          |
|                                    | *(Future)* Track Completed Learning    | `/app/profile/me` or `/app/learning` - Progress Tracker | `POST /api/learning/completion`                  | POST   | Manually log or integrate with LMS                       |
| **2. Wellness**                    | View Wellness Resources                | `/app/wellness` - Resource List                      | `GET /api/wellness/resources`                    | GET    | Access links to EAP, articles, meditation tools          |
|                                    | Participate in Wellness Challenge      | `/app/wellness` or `/app/challenges` - Progress View | `POST /api/wellness/log`                         | POST   | Log steps, activity minutes (points awarded)             |
|                                    | *(Future)* Mood Check-in               | `/app/wellness` - Simple Emoji Selector              | `POST /api/wellness/mood`                        | POST   | Log daily mood (optional, data privacy crucial)            |
| **3. Collaboration**               | View/Join Interest Groups            | `/app/connect/groups` - Group Directory/Pages      | `GET /api/groups`, `POST /api/groups/[groupId]/join` | GET/POST | Find and join groups based on interests                  |
|                                    | View Enhanced User Profiles            | `/app/profile/[userId]` - Profile Page               | `GET /api/users/[userId]`                        | GET    | See skills, interests, team (if user added this info)    |
|                                    | *(Future)* Virtual Coffee Opt-in/Match | `/app/connect/coffee` - Opt-in Toggle/Match Display | `PUT /api/connect/coffee/optin`, `GET /api/connect/coffee/match` | PUT/GET | Get matched with a random colleague                        |
|                                    | *(Future)* View Project/Team Updates | `/app/connect/updates` - Feed                        | `GET /api/updates`                               | GET    | See updates shared by teams (if feature added)             |
| **4. Culture & Camaraderie**     | **(MVP Focus)** View Kudos Feed        | `/app/kudos` - Feed Display                          | `GET /api/kudos`                                 | GET    | See recognition across the company                       |
|                                    | **(MVP Focus)** Give Kudos             | "Give Kudos" Button -> Dialog/Form                   | `POST /api/kudos`                                | POST   | Recognize peers (points awarded)                         |
|                                    | Search Users (for giving Kudos)      | Autocomplete Input (Shadcn Command) in Form          | `GET /api/users?search=[query]`                  | GET    | Find colleagues                                          |
|                                    | View Company News/Announcements      | Dashboard or `/app/news` - Feed Display            | `GET /api/announcements`                         | GET    | See official updates posted by Admins                    |
|                                    | View Employee Spotlights             | Dashboard or `/app/culture` - Spotlight Component    | `GET /api/spotlights`                            | GET    | Learn about colleagues                                   |
|                                    | *(Future)* View Anniversaries/Birthdays | Dashboard - Widget (Optional)                      | `GET /api/celebrations`                          | GET    | Needs HR data integration & privacy considerations       |
| **5. Competition & Rewards**     | **(MVP Focus)** View Own Points/Badges | `/app/profile/me`, Dashboard                         | `GET /api/users/me`                              | GET    | Track personal progress                                  |
|                                    | **(MVP Focus)** View Leaderboard       | `/app/leaderboard` - Table Display                   | `GET /api/leaderboard`                           | GET    | See ranking based on points                            |
|                                    | Participate in Challenges              | `/app/challenges` - Challenge List/Detail Pages    | `GET /api/challenges`, `POST /api/challenges/[challengeId]/participate` | GET/POST | Join specific learning, wellness, or team challenges       |
| **6. Morale & Recognition**      | **(MVP Focus)** View/Give Kudos        | *(Covered under Culture)*                            | *(Covered under Culture)*                        |        | Core peer recognition mechanism                          |
|                                    | View Team Wins/Highlights              | `/app/kudos` or `/app/news` - Specially Tagged Posts | `GET /api/kudos?type=team_win` (Example Filter)   | GET    | See highlighted team successes (posted by Admin/Manager) |

---

**Role: `ADMIN` (Platform Administrator)**

* **Includes ALL `USER` functionalities, UI, and Endpoints above.**
* **Plus the following Admin-specific capabilities:**

| Goal Addressed (Admin Task)        | Functionality (Admin Specific)          | UI Components / Sections                         | Associated API Endpoints (Requires ADMIN Role) | Method | Notes                                                         |
| :--------------------------------- | :-------------------------------------- | :----------------------------------------------- | :----------------------------------------------- | :----- | :------------------------------------------------------------ |
| **(Platform Mgmt)**                | **User Management**                     | `/app/admin/users` - Table, Buttons, Forms     | `GET /api/admin/users`, `PUT /api/admin/users/[userId]`, `PUT /api/admin/users/[userId]/status` | GET/PUT | View users, change roles, deactivate/activate             |
| **1. Learning & Innovation**       | Manage Learning Resources               | `/app/admin/learning` - Table/Form               | CRUD endpoints for `/api/admin/learning/resources` | CRUD   | Add, edit, delete curated learning resources, approve suggestions |
|                                    | Manage Innovation Ideas                 | `/app/admin/innovation` - Idea Board/List        | `GET /api/ideas`, `DELETE /api/ideas/[ideaId]` (Maybe PUT to feature) | GET/DEL/PUT | Review submitted ideas, potentially moderate/feature them |
|                                    | Manage Learning Challenges              | `/app/admin/challenges?type=learning` - Form/Table | CRUD endpoints for `/api/admin/challenges`        | CRUD   | Create/edit learning-focused challenges                     |
| **2. Wellness**                    | Manage Wellness Resources               | `/app/admin/wellness` - Table/Form               | CRUD endpoints for `/api/admin/wellness/resources` | CRUD   | Add/edit links to wellness tools, articles                |
|                                    | Manage Wellness Challenges              | `/app/admin/challenges?type=wellness` - Form/Table | CRUD endpoints for `/api/admin/challenges`        | CRUD   | Create/edit step challenges, activity challenges          |
| **3. Collaboration**               | Manage Interest Groups                  | `/app/admin/groups` - Table/Form                 | CRUD endpoints for `/api/admin/groups`           | CRUD   | Create official groups, moderate user-created groups      |
|                                    | *(Future)* Manage Project/Team Updates Feed | `/app/admin/updates` - Feed Control            | `DELETE /api/updates/[updateId]`               | DELETE | Moderate content if needed                                  |
| **4. Culture & Camaraderie**     | **(MVP Focus)** Manage Kudos Feed         | Inline Delete Buttons on `/app/kudos`            | `DELETE /api/kudos/[kudosId]`                    | DELETE | Moderate/remove inappropriate Kudos                         |
|                                    | Manage Announcements                    | `/app/admin/announcements` - Form/Table          | CRUD endpoints for `/api/admin/announcements`    | CRUD   | Post official company news                                |
|                                    | Manage Employee Spotlights              | `/app/admin/spotlights` - Form/Table             | CRUD endpoints for `/api/admin/spotlights`       | CRUD   | Create/feature employee spotlights                        |
| **5. Competition & Rewards**     | **(MVP Focus)** Manage Badges             | `/app/admin/badges` - Form/Table                 | CRUD endpoints for `/api/admin/badges`           | CRUD   | Define/edit available badges and criteria                 |
|                                    | Manage Challenges (General)             | `/app/admin/challenges` - Form/Table             | CRUD endpoints for `/api/admin/challenges`        | CRUD   | Create/edit/delete various challenges                   |
|                                    | *(Future)* Adjust User Points            | `/app/admin/users` - Point Adjustment Input      | `POST /api/admin/users/[userId]/points`          | POST   | Manually grant/deduct points with reason                  |
| **6. Morale & Recognition**      | Feature/Highlight Recognition           | `/app/admin/kudos` or `/app/admin/highlights`    | `PUT /api/kudos/[kudosId]` (add isFeatured flag) | PUT    | Make specific Kudos or team wins more prominent           |

---

This expanded plan provides a roadmap for building a comprehensive platform addressing all the initial goals. You'd still start with the MVP focus areas but have a clear vision and structure for adding learning, wellness, broader collaboration, and more nuanced culture features over time. Good luck!

--------------------------
Okay, here is a suggested priority-wise flow for building the features, focusing on delivering core value and engagement early (MVP) and then expanding coverage to all six goals. This assumes a multi-day build process where you can layer functionality.

**Phase 1: Foundation & Core Engagement Loop (MVP)**

* **Goal:** Get the basic app running, authenticated, and demonstrate the primary "fun & engaging" loop (recognition + rewards).
* **Priority:** Highest

| Feature # | Feature Name                 | Goals Addressed         | Description                                                                 | Key Components                                       | Dependencies                |
| :-------- | :--------------------------- | :---------------------- | :-------------------------------------------------------------------------- | :--------------------------------------------------- | :-------------------------- |
| 1         | Project Setup & Base Layout  | (Infrastructure)        | Initialize Next.js, Prisma, Postgres, NextAuth, Shadcn. Setup `/app` route. | Project structure, `globals.css`, basic Layout component | -                           |
| 2         | User Authentication          | (Infrastructure)        | Login/Signup (Credentials/OAuth), Session Management, Protected Routes.     | NextAuth config, Login Page UI, `useSession` hook      | #1                          |
| 3         | Basic User Model & Profile   | (Infrastructure), 5, 6  | Prisma `User` model (incl. `points`), `/app/profile/me` page (view only).   | `schema.prisma`, Profile Page UI, `/api/users/me`    | #1, #2                      |
| 4         | Kudos Model & API            | 4, 6                    | Prisma `Kudos` model, API endpoint to create Kudos (`POST /api/kudos`).     | `schema.prisma`, API route logic                     | #1, #3                      |
| 5         | Give Kudos UI                | 4, 6                    | Button -> Dialog/Form to select user (basic search) and submit message.     | Shadcn Dialog, Form, Command (for search), Fetch call | #2, #3, #4                  |
| 6         | View Kudos Feed UI           | 4, 6                    | `/app/kudos` page displaying a list of recent Kudos (Giver, Receiver, Msg). | Kudos Feed component (Cards/List), `/api/kudos` (GET) | #2, #4                      |
| 7         | Points Logic (Basic)         | 5, 6                    | Award points (update User.points) when Kudos are given/received.            | Logic within `POST /api/kudos` API handler           | #3, #4                      |
| 8         | Leaderboard (Basic)          | 5                       | `/app/leaderboard` page displaying top users by `User.points`.            | Leaderboard Table UI, `/api/leaderboard` (GET)       | #2, #3, #7                  |
| 9         | Display Points on Profile/Dash | 5, 6                    | Show user's own points prominently.                                         | Dashboard UI, Profile UI                           | #3, #7                      |

---

**Phase 2: Enhancing the Core & Basic Admin**

* **Goal:** Make the MVP features more robust, add simple badges, and introduce basic admin capabilities for moderation and visibility.
* **Priority:** High

| Feature # | Feature Name                  | Goals Addressed         | Description                                                           | Key Components                                           | Dependencies             |
| :-------- | :---------------------------- | :---------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------- | :----------------------- |
| 10        | Admin Role & Basic Check      | (Infrastructure)        | Add `Role` to User model, update NextAuth session, seed 1st Admin.  | `schema.prisma`, NextAuth callbacks, Seed script/Manual DB | #2, #3                   |
| 11        | Admin: Delete Kudos           | 4, 6                    | Add delete button (Admin only UI), `DELETE /api/kudos/[kudosId]` endpoint. | Conditional UI rendering, API route role check         | #6, #10                  |
| 12        | Badge System (Models & Logic) | 5                       | Prisma `Badge`, `UserBadge` models. Logic to award simple badges (e.g., "First Kudos"). | `schema.prisma`, Badge awarding logic (e.g. in Kudos API) | #3, #4                   |
| 13        | Display Badges on Profile     | 5                       | Show earned badges on `/app/profile/me`.                              | Profile UI component, `/api/users/me` (update)           | #3, #12                  |
| 14        | User Search Enhancement       | 3, 4                    | Improve user search for Kudos (better UI, maybe debounce).            | Shadcn Command refinement, `/api/users` endpoint       | #5                       |
| 15        | Admin: View Users List        | (Infrastructure)        | `/app/admin/users` page (Admin only) showing basic user list/roles. | Admin layout, User Table UI, `/api/admin/users` (GET)    | #10                      |

---

**Phase 3: Expanding Goal Coverage (Adding New Modules)**

* **Goal:** Start introducing features specifically targeting Learning, Wellness, and broader Collaboration. Focus on simple implementations first (e.g., content display, basic submission).
* **Priority:** Medium

| Feature # | Feature Name                 | Goals Addressed | Description                                                     | Key Components                                        | Dependencies       |
| :-------- | :--------------------------- | :-------------- | :-------------------------------------------------------------- | :---------------------------------------------------- | :----------------- |
| 16        | Learning: Resources View/Add | 1               | Model, API, and UI to view/suggest learning links/articles.   | Schema, CRUD API (`/api/learning/...`), Learning Page UI | #2, #10 (for admin) |
| 17        | Innovation: Idea Submit/View | 1               | Model, API, and UI for submitting/viewing innovation ideas.     | Schema, CRUD API (`/api/ideas/...`), Innovation Page UI | #2, #10 (for admin) |
| 18        | Wellness: Resources View     | 2               | Simple page listing curated wellness links/resources (Admin managed). | `/app/wellness`, `/api/wellness/resources` (GET), Admin CRUD | #2, #10            |
| 19        | Culture: Announcements       | 4, 6            | Admin posts news/announcements, users view on Dashboard/News page. | Schema, CRUD API (`/api/announcements`), UI Component     | #2, #10            |
| 20        | Collaboration: Interest Groups | 3               | Models, API, UI for viewing/joining basic interest groups.      | Schema, API (`/api/groups/...`), Groups Page UI         | #2, #10 (for admin) |
| 21        | Enhanced Profiles            | 3               | Allow users to add interests/skills to their profile.         | Profile Page Edit UI, `PUT /api/users/me`              | #3                 |

---

**Phase 4: Deeper Features & Refinements**

* **Goal:** Add more interactive elements like challenges, improve admin controls, and refine existing features.
* **Priority:** Low (Post-Core Functionality)

| Feature # | Feature Name                | Goals Addressed | Description                                                      | Key Components                                        | Dependencies           |
| :-------- | :-------------------------- | :-------------- | :--------------------------------------------------------------- | :---------------------------------------------------- | :--------------------- |
| 22        | Challenge System (Basic)    | 1, 2, 5         | Admin defines challenges (learning/wellness), users join/log progress. | Schema, Challenge CRUD API, Challenge Pages UI        | #2, #10, Points System |
| 23        | Admin: Full User Management | (Infrastructure)| UI/API for changing roles, activating/deactivating users.        | Admin User Table enhancements, PUT API endpoints        | #15                    |
| 24        | Admin: Full Content Mgmt    | 1, 2, 4         | Robust admin UIs for managing resources, ideas, groups, etc.     | Dedicated Admin Pages/Sections for each module        | Phase 3 Features     |
| 25        | Point Logging System        | 5               | Implement `PointLog` model for better tracking/auditing.       | Schema, Update point logic to use PointLog            | #7                     |
| 26        | Notifications (Basic)       | (Engagement)    | Simple in-app notifications (e.g., "You received Kudos!").     | Notification component, backend logic                 | Core Features        |
| 27        | Advanced Badge Logic        | 5               | More complex badge criteria and awarding mechanisms.             | Refined badge awarding services                       | #12                    |
| 28        | Wellness: Mood Check-in     | 2               | Simple UI/API for optional mood logging (consider privacy).    | UI component, API endpoint                            | #2                     |
| 29        | Collaboration: Coffee Chat  | 3               | Opt-in feature for random colleague matching.                  | UI Toggle, Matching logic/API                         | #21                    |

This flow prioritizes getting a usable, engaging core product first, then layering complexity and breadth. Remember to test frequently and gather feedback (even internally within the team) as you progress through these phases.

------------------------------------------


Okay, let's move ahead and solidify the plans for the remaining high/medium priority items. We'll choose effective tools and outline actionable steps.

**1. Detailed UI/UX Design & Wireframing Plan**

*   **Tool Choice:** **Figma**. It's the industry standard, offers a generous free tier, excellent collaboration features, component libraries, and prototyping capabilities. (Alternative for rapid sketching: Excalidraw).
*   **Process & Action Items:**
    *   **Assign Lead:** Designate one team member (or pair) to lead the initial wireframing in Figma.
    *   **Create Figma File:** Set up a shared Figma project.
    *   **Low-Fidelity Wireframes (Initial Focus - MVP Screens):**
        *   `/auth/signin` (Login Page)
        *   `/app` (Dashboard)
        *   `/app/kudos` (Kudos Feed Page)
        *   Give Kudos (Dialog/Modal Component)
        *   `/app/leaderboard` (Leaderboard Page)
        *   `/app/profile/me` (User Profile Page)
        *   `/app/admin/users` (Basic Admin User List Page - *if time permits in initial design phase*)
    *   **Define Core Navigation:** Decide on the main navigation pattern (e.g., Sidebar for main sections like Dashboard, Kudos, Leaderboard, Profile; Top bar for user menu/logout). Use Shadcn components conceptually (`Sheet` for mobile sidebar, `NavigationMenu`, `DropdownMenu`).
    *   **Basic Layout Structure:** Define reusable page layout components (e.g., `AppLayout` containing the sidebar/header and main content area).
    *   **User Flow Mapping:** Briefly map the flow for core tasks in Figma (e.g., Login -> Dashboard -> View Kudos -> Give Kudos -> See Success).
    *   **Responsiveness:** For each key wireframe, create a conceptual mobile view alongside the desktop view to plan content reflow.
    *   **Component Mapping:** Annotate wireframes with intended Shadcn components (e.g., "Use Shadcn Table here", "Shadcn Card for Kudos items", "Shadcn Dialog for Give Kudos").
    *   **Iterate:** Briefly review wireframes as a team before heavy frontend coding begins.

**2. Frontend State Management Strategy**

*   **Tool Choices:**
    *   **Server State & Caching:** **TanStack Query (v5 / React Query)**. It's the best-in-class solution for fetching, caching, synchronizing, and updating server state in React/Next.js. It simplifies loading/error states, handles background refetching, mutations, and integrates perfectly with async functions fetching from your API routes.
    *   **Client State (Global/Shared):** **Zustand**. It's a small, fast, scalable state management solution using a simplified Flux pattern. Great for managing state that isn't server state, like UI mode toggles, form state across steps (if complex), or potentially the state of the "Give Kudos" modal, without the boilerplate of Redux or Context complexities.
    *   **Local Component State:** React's built-in `useState` and `useReducer` for state confined to single components.
*   **Implementation Plan:**
    *   Install TanStack Query: `npm install @tanstack/react-query`
    *   Wrap the application (`_app.tsx` or main `layout.tsx`) with `QueryClientProvider`.
    *   Use `useQuery` hook for fetching data (e.g., Kudos feed, leaderboard, user profile). Keys should reflect the data being fetched (e.g., `['kudos', { limit: 20 }]`).
    *   Use `useMutation` hook for creating/updating/deleting data (e.g., submitting Kudos, updating profile). Handle `onSuccess`, `onError` callbacks for side effects like cache invalidation or showing toasts.
    *   Install Zustand: `npm install zustand`
    *   Create small, atomic stores as needed (e.g., `create` a `useKudosModalStore` to manage its open/closed state and potentially the recipient being targeted).
    *   Use standard `useState` for simple component-level state.

**3. Detailed Error Handling Strategy**

*   **Backend (API Routes):**
    *   **Tooling:** `try...catch` blocks, `Zod` for validation errors, Prisma error types (`Prisma.PrismaClientKnownRequestError` etc.), standard `NextApiResponse`.
    *   **Plan:**
        *   Wrap main API handler logic in `try...catch`.
        *   Validate incoming request bodies/query params using Zod schemas *first*. If validation fails, return a 400 Bad Request with Zod's error details.
        *   In the `catch` block:
            *   Check for specific Prisma errors (e.g., `P2002` for unique constraint violations, `P2025` for record not found) and return appropriate status codes (409 Conflict, 404 Not Found).
            *   Log the unexpected error to the console (`console.error`).
            *   Return a generic 500 Internal Server Error response `{ "error": { "message": "An unexpected error occurred." } }` to the client (avoid leaking implementation details).
        *   Use specific HTTP status codes consistently (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error).
*   **Frontend (UI):**
    *   **Tooling:** TanStack Query (`isError`, `error` properties), `useMutation`'s `onError` callback, Shadcn `Toast` (using `useToast` hook) / `Alert` components.
    *   **Plan:**
        *   **Queries (`useQuery`):** Use the `isError` boolean to conditionally render an error message (e.g., using Shadcn `Alert` component with `variant="destructive"`). The `error` object contains the error details (if needed for specific messages, but often a generic "Failed to load..." is sufficient).
        *   **Mutations (`useMutation`):** Use the `onError` callback. Inside it, use the `toast` function from Shadcn's `useToast` hook to display a user-friendly error message (e.g., `toast({ title: "Error", description: "Could not submit Kudos. Please try again.", variant: "destructive" })`).
        *   **Loading States:** Use TanStack Query's `isLoading` (initial load) and `isFetching` (background refetch) booleans to show loading indicators (e.g., Shadcn `Skeleton` components or spinners).
        *   **Forms:** Display validation errors inline near the form fields (using state managed by `react-hook-form` if used).

**4. Input Validation Strategy**

*   **Tool Choice:** **Zod**. Excellent TypeScript integration, easy schema definition, works on both frontend and backend.
*   **Implementation Plan:**
    *   Install Zod: `npm install zod`
    *   **Define Schemas:** Create Zod schemas mirroring your expected data structures (e.g., `KudosCreateSchema = z.object({ receiverId: z.string().cuid(), message: z.string().min(1).max(280) })`). Define these in a shared location (e.g., `lib/schemas` or `shared/schemas`) accessible by both frontend and backend.
    *   **Backend Validation:** In API routes, use `schema.safeParse(req.body)` or `schema.parse(req.body)`. If parsing fails (`success === false` for `safeParse`, or `parse` throws), return a 400 error with the issues.
    *   **Frontend Validation:**
        *   **Tool:** Use `react-hook-form` with `@hookform/resolvers/zod`. Install: `npm install react-hook-form @hookform/resolvers`.
        *   **Implementation:** Define forms using `useForm` hook from `react-hook-form`, passing your Zod schema to the `zodResolver`. This automatically handles validation on input change/blur/submit and provides an `errors` object to display messages in the UI.

**5. Accessibility (a11y) Plan**

*   **Tooling:**
    *   **Linters:** `eslint-plugin-jsx-a11y` (often included in Next.js setup or easily added). Configure rules in `.eslintrc.js`.
    *   **Manual Testing:** Keyboard navigation (Tab, Shift+Tab, Enter, Space), checking focus indicators.
    *   **Browser DevTools:** Accessibility tab (inspect elements, check contrast).
    *   **Shadcn UI:** Leverage its built-in accessibility features (keyboard nav, ARIA attributes where appropriate).
*   **Action Items (Ongoing during Development):**
    *   **Use Semantic HTML:** Use `<main>`, `<nav>`, `<aside>`, `<button>`, proper heading levels (`<h1>`, `<h2>`, etc.) correctly.
    *   **Keyboard Navigation:** Ensure all interactive elements (buttons, links, inputs) are reachable and operable using the keyboard alone. Ensure logical tab order.
    *   **Focus Indicators:** Ensure clear visual focus states (Shadcn usually provides good defaults, don't disable them with `outline: none` without providing an alternative).
    *   **Image `alt` Text:** Provide descriptive `alt` text for all meaningful images. For decorative images, use `alt=""`.
    *   **Form Labels:** Ensure all form inputs have associated, clear `<label>` elements.
    *   **Color Contrast:** Use browser DevTools or online checkers to ensure text has sufficient contrast against its background.
    *   **ARIA (Use Sparingly):** Only add ARIA attributes (`aria-label`, `aria-hidden`, `role` etc.) when semantic HTML is insufficient to convey meaning or state (Shadcn often handles this for its components like Dialogs, Menus).
    *   **Test Regularly:** Periodically navigate key flows using only the keyboard.

**6. Security Considerations Plan**

*   **Tooling:** `.env` files, NextAuth, Zod, `npm audit`.
*   **Action Items (Ongoing during Development):**
    *   **Strict Input Validation:** (Covered by Zod implementation) - Sanitize/validate ALL external input on the backend.
    *   **Authentication & Authorization:** Rely on NextAuth for authentication. Implement rigorous role checks (using `session.user.role`) in API endpoints and for conditional UI rendering for ALL sensitive actions/data.
    *   **Environment Variables:** Store ALL secrets (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, any future API keys) in `.env.local` (which is gitignored) or via hosting provider's environment variable settings. NEVER hardcode secrets.
    *   **Dependency Updates:** Run `npm audit` periodically and update dependencies to patch known vulnerabilities.
    *   **HTTPS:** Ensure deployment is configured for HTTPS (Vercel does this automatically).
    *   **Rate Limiting Awareness:** While not implementing now, be aware that public-facing endpoints (like login) or resource-intensive ones might eventually need rate limiting to prevent abuse.
    *   **Cross-Site Scripting (XSS):** React automatically escapes most content rendered in JSX. Be extremely careful if ever using `dangerouslySetInnerHTML`. Render user-generated content (like Kudos messages) as text.
    *   **Cross-Site Request Forgery (CSRF):** NextAuth provides CSRF protection, especially when using JWT sessions and its built-in providers. Ensure standard practices are followed.

This detailed plan provides a concrete roadmap for tackling the essential remaining planning items before or alongside the initial coding phases. You have clear tool choices and actionable steps for UI/UX, state management, error handling, validation, accessibility, and security. Proceed with building Phase 1 features, keeping these strategies in mind!