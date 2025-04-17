// types/index.d.ts (or a relevant file)
import { User as PrismaUser } from '@prisma/client'; // Or define explicitly

export type UserProfile = Omit<PrismaUser, 'passwordHash' | 'emailVerified'> & {
    // Add relations later if needed, e.g.:
    // userBadges: Array<{ badge: { id: string; name: string; description: string; iconUrl: string | null } }>
};