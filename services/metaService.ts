// services/metaService.ts (NEW FILE)
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Lists all available positions.
 */
export const listPositions = async () => {
    return prisma.position.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true } // Select only needed fields
    });
};

/**
* Searches for existing skills based on a query.
*/
export const searchSkills = async (query: string, limit: number = 10) => {
     if (!query) return [];
     return prisma.skill.findMany({
         where: {
             name: { contains: query.toLowerCase(), mode: 'insensitive' }
         },
         take: limit,
         orderBy: { name: 'asc'},
         select: { id: true, name: true}
     });
};