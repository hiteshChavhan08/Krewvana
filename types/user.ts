// types/user.ts (Example location)

export type BadgeData = {
    id: string;
    name: string;
    description: string;
    iconName: string | null;
  };
  
  export type UserBadgeData = {
    earnedAt: string; // Keep as string from API or Date if parsed
    badge: BadgeData;
  };
  
  // Main profile data structure returned by the API
  export type UserProfile = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    points: number;
    createdAt: string; // Keep as string from API
    hobbies: string | null;
    favoriteFood: string | null;
    askMeAbout: string | null;
    userBadges?: UserBadgeData[];
  };
  
  // Type for the editable form fields
  export type ProfileFormData = {
    name: string;
    hobbies: string;
    favoriteFood: string;
    askMeAbout: string;
  };