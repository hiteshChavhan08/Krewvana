# 📜 System Prompt: Full-Stack Next.js Employee Engagement Platform for Kanaka

## ➤ Overview

The pandemic was a dark chapter in everybody's lives. Some aspects in people’s lives have changed forever. One of the key challenges has been **employee engagement**—especially at Kanaka—reverting to pre-pandemic levels. 

Social shifts in the past 5 years demand a new paradigm in how we approach this. This hackathon project envisions a **mobile and browser-accessible platform** that is **fun, engaging, and meaningful**, boosting employee morale, collaboration, wellness, and growth.

---

## ➤ Goals of the Platform

1. 📚 Boost participation in learning and encourage innovation  
2. 🧠 Improve mental and physical wellness  
3. 🤝 Increase collaboration across teams  
4. 🌱 Build stronger culture and camaraderie  
5. 🏆 Encourage healthy competition through rewards and fun  
6. 💡 Improve morale through recognition

---

## ➤ Tech Stack

- **Next.js** (latest stable version)
- **TypeScript**
- **Prisma ORM** (PostgreSQL or supported DB)
- **NextAuth.js** (with Prisma Adapter for authentication)
- **shadcn/ui** – UI primitives
- **Aceternity UI** – Modern animations/UI
- **Magic UI** – Interactive design elements
- **SWR** – Lightweight GET data fetching
- **TanStack** (Query/Table/Router)
- **Sonner** – Toast notifications (via `shadcn`)

---

## ➤ Folder Structure
```
/app
  /api
    /auth [...nextauth] – NextAuth route
  /app - All route pages
/components
/hooks
/lib
  - auth.ts       // NextAuth config
  - db.ts         // Prisma client
/prisma
  - schema.prisma
/utils
/store
/constants
/styles
public/
```

---

## ➤ Authentication Rules (NextAuth.js)

1. **Authentication Strategy**
   - Use **Credentials Provider** or OAuth (Google, GitHub, etc.)
   - Always use **secure environment variables** for secrets

2. **Prisma Adapter Integration**
   - Store sessions, users using Prisma
   - Extend `User` model (e.g., `role`, `profileImage`)

3. **Session Access**
   - Server: `getServerSession()` via `lib/auth.ts`
   - Client: `useSession()` from `next-auth/react`

4. **Route Protection**
   - Server: Use `getServerSession()` to guard routes
   - Client: Check `session.status === "authenticated"`

5. **Custom UI**
   - No default NextAuth pages
   - Build forms with `shadcn/ui`
   - Use `sonner` toast like `toast.success("Login successful")`

6. **RBAC (Role-Based Access Control)**
   - Define roles in Prisma schema + enums
   - Validate roles in pages & APIs

7. **Best Practices**
   - Auth logic in `lib/auth.ts`
   - Export `authOptions`, `getServerSession`
   - Customize session callback (add `user.id`, `role`, etc.)

---

## ➤ Data Fetching Strategy

- **SWR** – Use for `GET` requests and public data
- **TanStack Query** – Use for:
  - `POST`, `PUT`, `DELETE`
  - Mutations
  - Infinite scroll
  - Complex dependencies

---

## ➤ Toast Notifications

- Use `Sonner` via `shadcn/ui`
- Wrap toasts in utility (e.g., `toastSuccess("Logged in!")`)

---

## ➤ Dev Best Practices

- Ensure type-safety end-to-end
- All sensitive routes must be protected (server-first)
- Use modular, reusable hooks (e.g., `useCurrentUser()`)
- Use UI libraries (Shadcn, Magic UI, Aceternity UI) only if needed – confirm update before use

---

## ➤ Project-Specific Note

Maintain a **utility or manifest** that tracks:
- Developed APIs
- Implemented Pages
- Added Components
- Reusable Hooks

This ensures **modular growth** and **complete visibility** across dev and feature lifecycle.

---

# 🗂️ Current API and Component Tracking

| Type         | Name/Path                                      | Status   | Notes                                      |
|--------------|-----------------------------------------------|----------|--------------------------------------------|
| API Route    | `POST /api/auth/[...nextauth]`                | ✅ Done   | NextAuth config using Prisma adapter       |
| API Route    | `GET /api/users/me`                           | ✅ Done   | Fetch logged-in user details               |
| API Route    | `GET /api/leaderboard`                        | ✅ Done   | Fetch leaderboard data                     |
| API Route    | `POST /api/questions`                         | ✅ Done   | Create a new question                      |
| API Route    | `GET /api/questions`                          | ✅ Done   | Fetch list of questions with pagination    |
| API Route    | `GET /api/questions/[questionId]`             | ✅ Done   | Fetch details of a specific question       |
| API Route    | `POST /api/mentorship/circles`                | ✅ Done   | Create a new mentorship circle             |
| API Route    | `GET /api/mentorship/circles`                 | ✅ Done   | Fetch list of mentorship circles           |
| API Route    | `POST /api/ama/sessions`                      | ✅ Done   | Create a new AMA session                   |
| API Route    | `GET /api/ama/sessions`                       | ✅ Done   | Fetch list of AMA sessions                 |
| Page         | `/dashboard`                                  | ✅ Done   | Dashboard landing page                     |
| Page         | `/qna`                                        | ✅ Done   | Q&A main page                              |
| Page         | `/qna/[questionId]`                           | ✅ Done   | Q&A question details page                  |
| Page         | `/mentorship`                                 | ✅ Done   | Mentorship main page                       |
| Page         | `/mentorship/circles/[circleId]`              | ✅ Done   | Mentorship circle details page             |
| Page         | `/ama`                                        | ✅ Done   | AMA main page                              |
| Page         | `/ama/sessions/[sessionId]`                   | ✅ Done   | AMA session details page                   |
| Component    | `QuestionListItem.tsx`                        | ✅ Done   | Display a single question in a list        |
| Component    | `MentorshipCircleCard.tsx`                    | ✅ Done   | Display a mentorship circle card           |
| Component    | `AMASessionCard.tsx`                          | ✅ Done   | Display an AMA session card                |
| Hook         | `useCurrentUser.ts`                           | ✅ Done   | Get current user via SWR                   |
| Hook         | `usePagination.ts`                            | ✅ Done   | Handle pagination logic                    |
| Utility      | `toast.ts`                                    | ✅ Done   | Toast utilities (success, error)           |

---

✅ **Done** | 🚧 **Work in Progress** | 📝 **Planned**
