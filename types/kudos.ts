// types/kudos.ts (or similar shared types file)

// Define the shape of a single category's data
export type KudosCategoryData = {
  id: string;
  name: string;
  description?: string | null;
  iconName?: string | null; // Optional icon identifier
};

// User data (add role if needed/available)
export type KudosUser = {
  id: string;
  name: string | null;
  image: string | null;
  role?: string | null;
};

// Main Kudos data structure from API
export type KudosData = {
  id: string;
  message: string;
  createdAt: string; // Keep as string from API, parse on client

  giver: KudosUser | null;
  receiver: KudosUser | null;

  // Array representing the linked categories
  // The structure depends on your Prisma include:
  // Option A: Direct array of categories (simpler if you map on backend)
  // categories?: KudosCategoryData[];
  // Option B: Array of link objects containing the category (matches Prisma include structure)
  kudosCategories?: {
      category: KudosCategoryData;
  }[]; // Array of links, each containing a category object

  // Optional interaction counts
  likes?: number;
  comments?: number;

  // Optional like status for current user
  // currentUserHasLiked?: boolean;
};

// Type for data needed to CREATE kudos via API
export type KudosCreatePayload = {
    message: string;
    receiverId: string;
    // Array of category IDs selected by the user
    categoryIds: string[];
};