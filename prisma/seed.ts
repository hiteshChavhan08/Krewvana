// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial badges...');

  const badgesToCreate = [
    {
      id: 'kudos_giver_1', // Use predictable IDs for logic checks
      name: 'First Kudos',
      description: 'You shared your first recognition!',
      iconName: 'Send', // Example lucide-react icon name
      criteriaDesc: 'Give your first Kudos to a colleague.',
    },
    {
      id: 'kudos_receiver_1',
      name: 'Appreciated',
      description: "You've received your first Kudos!",
      iconName: 'HeartHandshake',
      criteriaDesc: 'Receive your first Kudos from a colleague.',
    },
    {
      id: 'kudos_receiver_5',
      name: 'Valued Colleague',
      description: "You've received 5 Kudos!",
      iconName: 'Sparkles',
      criteriaDesc: 'Receive 5 Kudos from colleagues.',
    },
    // Add more badges later (e.g., for profile completion, participation)
  ];

  for (const badgeData of badgesToCreate) {
    // Use upsert to avoid errors if seeding runs multiple times
    // and to allow easy updates to badge descriptions etc.
    await prisma.badge.upsert({
      where: { id: badgeData.id },
      update: {
        name: badgeData.name,
        description: badgeData.description,
        iconName: badgeData.iconName,
        criteriaDesc: badgeData.criteriaDesc,
       },
      create: badgeData,
    });
    console.log(` Upserted badge: ${badgeData.name}`);
  }

  console.log('Badge seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });