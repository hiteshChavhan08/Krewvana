
// prisma/seed.ts
import { PrismaClient, MentorshipSkill } from '@prisma/client';

const prisma = new PrismaClient();

const skillsToSeed: Omit<MentorshipSkill, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Advanced Slack Usage', description: 'Go beyond basic messaging: workflows, integrations, advanced search.' },
  { name: 'AI Prompt Engineering Basics', description: 'Learn how to effectively interact with generative AI models like ChatGPT.' },
  { name: 'Figma Fundamentals', description: 'Introduction to UI/UX design collaboration using Figma.' },
  { name: 'Mastering Google Workspace', description: 'Tips and tricks for Gmail, Calendar, Drive, Docs, and Sheets.' },
  { name: 'Effective Remote Collaboration', description: 'Tools and techniques for staying connected and productive while remote.' },
  { name: 'Introduction to Next.js', description: 'Basics of building modern web applications with Next.js.' },
  { name: 'Understanding Gen Z Communication', description: 'Insights into preferred communication styles and platforms.' },
  { name: 'Cybersecurity Best Practices', description: 'Protecting yourself and the company from online threats.' },
];

async function main() {
  console.log(`Start seeding ...`);

  for (const skillData of skillsToSeed) {
    try {
       const skill = await prisma.mentorshipSkill.upsert({
         where: { name: skillData.name }, // Use name as the unique identifier for upsert
         update: { description: skillData.description }, // Update description if name exists
         create: skillData, // Create if name doesn't exist
       });
       console.log(`Upserted skill: ${skill.name} (ID: ${skill.id})`);
    } catch (error) {
        console.error(`Error upserting skill "${skillData.name}":`, error);
    }
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
