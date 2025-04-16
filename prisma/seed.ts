// prisma/seed.ts
import {
  PrismaClient,
  Role,
  GroupType,
  GroupRole,
  VoteType,
  NotificationType,
  Prisma, // Import Prisma namespace
  User,
  Profile,
  Enrollment, // Import specific types if needed
  Vote,
  Group,
  GroupMember,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Define a more specific type for the user object including the profile
type UserWithProfile = Prisma.UserGetPayload<{
  include: { profile: true };
}>;

async function main() {
  console.log(`🌱 Start seeding ...`);

  // --- Clear Existing Data (Use with caution!) ---
  console.log("🗑️ Clearing existing data...");
  // (Deletion logic remains the same)
  await prisma.redemption.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.recognition.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.rewardItem.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.knowledgeBaseArticle.deleteMany();
  await prisma.moodLog.deleteMany();
  await prisma.wellnessActivity.deleteMany();
  await prisma.challengeParticipant.deleteMany();
  await prisma.wellnessChallenge.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.challengeSubmission.deleteMany();
  await prisma.innovationChallenge.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.skillInterest.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.mentorshipSession.deleteMany();
  await prisma.workshopRegistration.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.learningPathItem.deleteMany();
  await prisma.learningPath.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Existing data cleared.");

  // --- Seed Users & Profiles ---
  console.log("👤 Seeding users and profiles...");
  const users: UserWithProfile[] = [];
  // ... (User creation logic remains the same as corrected before) ...
  for (let i = 0; i < 15; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const passwordHash = await bcrypt.hash("Password123!", SALT_ROUNDS);

    try {
      const user = await prisma.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: email,
          emailVerified: faker.date.past(),
          image: faker.image.avatar(),
          passwordHash: passwordHash,
          role: faker.helpers.arrayElement([
            Role.USER,
            Role.MANAGER,
            Role.ADMIN,
          ]),
          profile: {
            create: {
              bio: faker.lorem.sentence(),
              department: faker.commerce.department(),
              jobTitle: faker.person.jobTitle(),
              location: faker.location.city(),
              interests: faker.lorem
                .words(faker.number.int({ min: 2, max: 6 }))
                .split(" "),
              skills: faker.lorem
                .words(faker.number.int({ min: 3, max: 8 }))
                .split(" "),
              points: faker.number.int({ min: 0, max: 5000 }),
            },
          },
        },
        include: { profile: true },
      });
      users.push(user);
    } catch (e) {
      /* ... error handling ... */
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          console.warn(`Skipped duplicate user email: ${email}`);
        } else {
          console.error(`Prisma error creating user ${email}: [${e.code}]`, e);
        }
      } else if (e instanceof Error) {
        console.error(`Failed to create user ${email}:`, e.message);
      } else {
        console.error(`An unknown error occurred creating user ${email}:`, e);
      }
    }
  }
  console.log(`✅ ${users.length} users created.`);
  const userIds = users.map((u) => u.id);

  // --- Seed Courses ---
  console.log("📚 Seeding courses...");
  // ... (Course seeding logic remains the same) ...
  const courseData = Array.from({ length: 25 }).map(() => ({
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraphs(2),
    source: faker.helpers.arrayElement([
      "Internal",
      "LinkedIn Learning",
      "Coursera",
      "Udemy",
    ]),
    url: faker.internet.url(),
    imageUrl: faker.image.urlLoremFlickr({
      category: "business",
      width: 640,
      height: 480,
    }), // Specific size
    difficulty: faker.helpers.arrayElement([
      "Beginner",
      "Intermediate",
      "Advanced",
    ]),
    tags: faker.lorem.words(faker.number.int({ min: 2, max: 5 })).split(" "),
  }));
  await prisma.course.createMany({ data: courseData, skipDuplicates: true });
  const createdCourses = await prisma.course.findMany({ select: { id: true } });
  const courseIds = createdCourses.map((c) => c.id);
  console.log(`✅ ${createdCourses.length} courses created.`);

  // --- Seed Enrollments ---
  console.log("🎓 Seeding enrollments...");
  let enrollmentsCreated = 0;
  for (const userId of userIds) {
    const coursesToEnroll = faker.helpers.arrayElements(
      courseIds,
      faker.number.int({ min: 1, max: 5 })
    );
    for (const courseId of coursesToEnroll) {
      try {
        const status = faker.helpers.arrayElement([
          "Not Started",
          "In Progress",
          "Completed",
        ]);
        const progress =
          status === "Completed"
            ? 100
            : status === "In Progress"
            ? faker.number.int({ min: 1, max: 99 })
            : 0;
        const completedAt = status === "Completed" ? faker.date.past() : null;

        // FIX: Ensure create call uses { data: { ... } }
        await prisma.enrollment.create({
          data: {
            userId: userId,
            courseId: courseId,
            status: status,
            progress: progress,
            completedAt: completedAt,
          },
        });
        enrollmentsCreated++;
      } catch (e) {
        // ... error handling ...
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code !== "P2002") {
            console.error(
              `Failed to create enrollment for user ${userId} course ${courseId}: [${e.code}]`,
              e
            );
          }
        } else if (e instanceof Error) {
          console.error(
            `Failed to create enrollment for user ${userId} course ${courseId}:`,
            e.message
          );
        } else {
          console.error(
            `An unknown error occurred creating enrollment for user ${userId} course ${courseId}:`,
            e
          );
        }
      }
    }
  }
  console.log(`✅ ${enrollmentsCreated} enrollments created.`);

  // --- Seed Ideas ---
  console.log("💡 Seeding ideas...");
  // ... (Idea seeding logic remains the same) ...
  const ideaData = userIds.flatMap((authorId) =>
    Array.from({ length: faker.number.int({ min: 0, max: 3 }) }).map(() => ({
      title: faker.lorem.sentence(5),
      description: faker.lorem.paragraphs(3),
      category: faker.helpers.arrayElement([
        "Product",
        "Process",
        "Culture",
        "Sustainability",
        "Efficiency",
      ]),
      status: faker.helpers.arrayElement([
        "Submitted",
        "Under Review",
        "Approved",
        "Implemented",
        "Rejected",
      ]),
      authorId: authorId,
    }))
  );
  await prisma.idea.createMany({ data: ideaData });
  const ideas = await prisma.idea.findMany({ select: { id: true } }); // Fetch created ideas
  const ideaIds = ideas.map((i) => i.id);
  console.log(`✅ ${ideas.length} ideas created.`);

  // --- Seed Votes ---
  console.log("🗳️ Seeding votes...");
  let votesCreated = 0;
  for (const ideaId of ideaIds) {
    const voters = faker.helpers.arrayElements(
      userIds,
      faker.number.int({ min: 0, max: users.length })
    );
    for (const userId of voters) {
      try {
        // FIX: Ensure create call uses { data: { ... } }
        await prisma.vote.create({
          data: {
            ideaId: ideaId,
            userId: userId,
            type: faker.helpers.arrayElement([VoteType.UP, VoteType.DOWN]),
          },
        });
        votesCreated++;
      } catch (e) {
        // ... error handling ...
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code !== "P2002") {
            console.error(
              `Failed to create vote for user ${userId} idea ${ideaId}: [${e.code}]`,
              e
            );
          }
        } else if (e instanceof Error) {
          console.error(
            `Failed to create vote for user ${userId} idea ${ideaId}:`,
            e.message
          );
        } else {
          console.error(
            `An unknown error occurred creating vote for user ${userId} idea ${ideaId}:`,
            e
          );
        }
      }
    }
  }
  console.log(`✅ ${votesCreated} votes created.`);

  // --- Seed Groups ---
  console.log("🧑‍🤝‍🧑 Seeding groups and members...");
  const groups: Group[] = []; // Use Group type imported from @prisma/client
  const groupTypes = [GroupType.INTEREST, GroupType.PROJECT, GroupType.TEAM];
  let groupMembersAdded = 0;

  for (let i = 0; i < 8; i++) {
    const creatorId = faker.helpers.arrayElement(userIds);
    const groupType = groupTypes[i % groupTypes.length];
    try {
      // FIX: Ensure create call uses { data: { ... } }
      const group = await prisma.group.create({
        data: {
          name: faker.company.buzzPhrase(),
          description: faker.lorem.paragraph(),
          type: groupType,
          isPublic: faker.datatype.boolean(0.8), // 80% public
        },
      });
      groups.push(group); // Add the created group to the array

      // Add creator as admin member
      // FIX: Ensure create call uses { data: { ... } }
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: creatorId,
          role: GroupRole.ADMIN,
        },
      });
      groupMembersAdded++;

      // Add some random other members
      const otherMembers = faker.helpers.arrayElements(
        userIds.filter((id) => id !== creatorId),
        faker.number.int({ min: 1, max: 8 })
      );
      for (const memberId of otherMembers) {
        try {
          // FIX: Ensure create call uses { data: { ... } }
          await prisma.groupMember.create({
            data: {
              groupId: group.id,
              userId: memberId,
              role: GroupRole.MEMBER,
            },
          });
          groupMembersAdded++;
        } catch (memberError) {
          // ... error handling for member add ...
          if (memberError instanceof Prisma.PrismaClientKnownRequestError) {
            if (memberError.code !== "P2002") {
              console.warn(
                `Failed to add member ${memberId} to group ${group.id}: [${memberError.code}]`,
                memberError
              );
            }
          } else if (memberError instanceof Error) {
            console.warn(
              `Failed to add member ${memberId} to group ${group.id}`,
              memberError.message
            );
          } else {
            console.warn(
              `An unknown error occurred adding member ${memberId} to group ${group.id}`,
              memberError
            );
          }
        }
      }
    } catch (groupError) {
      // ... error handling for group creation ...
      if (groupError instanceof Error) {
        console.error(`Failed to create group ${i}:`, groupError.message);
      } else {
        console.error(
          `An unknown error occurred creating group ${i}:`,
          groupError
        );
      }
    }
  }
  const groupIds = groups.map((g) => g.id);
  console.log(
    `✅ ${groups.length} groups created with ${groupMembersAdded} total memberships.`
  );

  // --- Seed Posts ---
  console.log("✍️ Seeding posts...");
  // ... (Post seeding logic remains the same - assuming it already used { data: ... }) ...
  let postsCreated = 0;
  for (const groupId of groupIds) {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const memberUserIds = members.map((m) => m.userId);
    if (memberUserIds.length === 0) continue; // Skip group if no members found

    const numPosts = faker.number.int({ min: 1, max: 5 });
    for (let i = 0; i < numPosts; i++) {
      const authorId = faker.helpers.arrayElement(memberUserIds);
      await prisma.post.create({
        data: {
          title: faker.lorem.sentence(faker.number.int({ min: 4, max: 8 })),
          content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 4 })),
          authorId: authorId,
          groupId: groupId,
          isAnnouncement: faker.datatype.boolean(0.1),
        },
      });
      postsCreated++;
    }
  }
  console.log(`✅ ${postsCreated} posts created.`);

  // --- Seed Badges ---
  console.log("🏆 Seeding badges...");
  // FIX: Populate badgeData with actual badge definitions
  const badgeData = [
    {
      name: "Innovation Champion",
      description: "Submitted 5+ innovative ideas.",
      criteria: "Submit 5 ideas",
      imageUrl: faker.image.urlLoremFlickr({
        category: "abstract",
        width: 128,
        height: 128,
      }), // Example image
    },
    {
      name: "Wellness Warrior",
      description: "Completed 3 wellness challenges.",
      criteria: "Complete 3 challenges",
      imageUrl: faker.image.urlLoremFlickr({
        category: "nature",
        width: 128,
        height: 128,
      }),
    },
    {
      name: "Top Mentor",
      description: "Successfully mentored 2 mentees.",
      criteria: "Complete 2 mentorships",
      imageUrl: faker.image.urlLoremFlickr({
        category: "people",
        width: 128,
        height: 128,
      }),
    },
    {
      name: "Learning Leader",
      description: "Completed 10 courses.",
      criteria: "Complete 10 courses",
      imageUrl: faker.image.urlLoremFlickr({
        category: "technology",
        width: 128,
        height: 128,
      }),
    },
    {
      name: "Recognition Rockstar",
      description: "Gave 20+ recognitions.",
      criteria: "Give 20 recognitions",
      imageUrl: faker.image.urlLoremFlickr({
        category: "nightlife",
        width: 128,
        height: 128,
      }),
    },
    {
      name: "Community Contributor",
      description: "Active participant in group discussions.",
      criteria: "Post/Comment frequently",
      imageUrl: faker.image.urlLoremFlickr({
        category: "city",
        width: 128,
        height: 128,
      }),
    },
  ];
  await prisma.badge.createMany({ data: badgeData, skipDuplicates: true }); // Use skipDuplicates in case names are re-run
  const createdBadges = await prisma.badge.findMany({
    select: { id: true, name: true },
  });
  const badgeIds = createdBadges.map((b) => b.id); // Get IDs for linking in Recognitions
  console.log(`✅ ${createdBadges.length} badges created.`);

  // --- Seed Reward Items ---
  console.log("🎁 Seeding reward items...");
  // FIX: Populate rewardItems with actual item definitions
  const rewardItems = [
    {
      name: "Company T-Shirt (Kanaka Design)",
      description: "High-quality branded t-shirt featuring the Kanaka logo.",
      pointsCost: 1000,
      stock: faker.number.int({ min: 20, max: 100 }), // Random stock
      imageUrl: faker.image.urlLoremFlickr({
        category: "fashion",
        width: 400,
        height: 400,
      }),
      isActive: true,
    },
    {
      name: "Kanaka Coffee Mug",
      description: "Start your day with the Kanaka logo mug.",
      pointsCost: 500,
      stock: faker.number.int({ min: 50, max: 150 }),
      imageUrl: faker.image.urlLoremFlickr({
        category: "objects",
        width: 400,
        height: 400,
      }),
      isActive: true,
    },
    {
      name: "$10 Gift Card (Online Retailer)",
      description: "Digital gift card for popular online stores.",
      pointsCost: 1500,
      stock: faker.number.int({ min: 100, max: 300 }),
      imageUrl: faker.image.urlLoremFlickr({
        category: "transport",
        width: 400,
        height: 400,
      }), // Placeholder category
      isActive: true,
    },
    {
      name: "Extra Half Day Off",
      description: "Enjoy an extra half day off (requires manager approval).",
      pointsCost: 5000,
      stock: null, // Unlimited stock represented by null
      imageUrl: faker.image.urlLoremFlickr({
        category: "beach",
        width: 400,
        height: 400,
      }), // Placeholder category
      isActive: true,
    },
    {
      name: "Donate $5 to Charity Partner",
      description:
        "Make a difference! Donation to our selected charity partner.",
      pointsCost: 750,
      stock: null, // Unlimited stock
      imageUrl: faker.image.urlLoremFlickr({
        category: "animals",
        width: 400,
        height: 400,
      }), // Placeholder category
      isActive: true,
    },
    {
      name: "Premium Kanaka Water Bottle",
      description: "Stay hydrated with this premium branded water bottle.",
      pointsCost: 1200,
      stock: faker.number.int({ min: 30, max: 80 }),
      imageUrl: faker.image.urlLoremFlickr({
        category: "sports",
        width: 400,
        height: 400,
      }),
      isActive: true,
    },
    {
      name: "Old Item (Inactive)",
      description: "This item is no longer available.",
      pointsCost: 200,
      stock: 0,
      imageUrl: faker.image.urlLoremFlickr({
        category: "cats",
        width: 400,
        height: 400,
      }),
      isActive: false, // Mark as inactive
    },
  ];
  await prisma.rewardItem.createMany({
    data: rewardItems,
    skipDuplicates: true,
  }); // Skip duplicates if re-run
  console.log(`✅ ${rewardItems.length} reward items created.`);

  // --- Seed Recognitions ---
  console.log("⭐ Seeding recognitions...");
  // ... (Recognition transaction logic remains the same as corrected before, including UserBadge create) ...
  let recognitionsCreated = 0;
  for (let i = 0; i < 50; i++) {
    const giverId = faker.helpers.arrayElement(userIds);
    let recipientId = faker.helpers.arrayElement(userIds);
    while (giverId === recipientId) {
      recipientId = faker.helpers.arrayElement(userIds);
    }
    const points = faker.helpers.maybe(
      () => faker.number.int({ min: 10, max: 100 }),
      { probability: 0.6 }
    );
    const badgeId =
      faker.helpers.maybe(() => faker.helpers.arrayElement(badgeIds), {
        probability: 0.1,
      }) || null;

    try {
      await prisma.$transaction(async (tx) => {
        const recognition = await tx.recognition.create({
          data: {
            /* recognition data */ giverId,
            recipientId,
            points,
            badgeId,
            message: faker.lorem.sentence(),
            valueTag: faker.helpers.arrayElement([
              "Teamwork",
              "Innovation",
              "Excellence",
              "Customer Focus",
              null,
            ]),
            isPublic: faker.datatype.boolean(0.9),
          },
        });
        recognitionsCreated++;
        if (points) {
          await tx.profile
            .update({
              where: { userId: recipientId },
              data: { points: { increment: points } },
            })
            .catch((e) =>
              console.warn(
                `Could not update points for profile ${recipientId}: ${
                  (e as Error).message
                }`
              )
            );
        }
        if (badgeId) {
          await tx.userBadge
            .create({
              data: {
                userId: recipientId,
                badgeId: badgeId,
                recognitionId: recognition.id,
              },
            })
            .catch((e) => {
              if (
                e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === "P2002"
              ) {
                /* Ignore */
              } else {
                throw e;
              }
            });
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `Failed transaction for recognition from ${giverId} to ${recipientId}:`,
          error.message
        );
      } else {
        console.error(
          `Unknown error in transaction for recognition from ${giverId} to ${recipientId}:`,
          error
        );
      }
    }
  }
  console.log(`✅ ${recognitionsCreated} recognitions created.`);

  // // --- Seed Reward Items ---
  // console.log("🎁 Seeding reward items...");
  // // ... (Reward item seeding logic remains the same) ...
  // const rewardItems = [ /* ... reward definitions ... */];
  // await prisma.rewardItem.createMany({ data: rewardItems, skipDuplicates: true });
  // console.log(`✅ ${rewardItems.length} reward items created.`);

  // --- Seed KB Articles ---
  console.log(" KNOWLEDGE SEED");
  // ... (KB article seeding logic remains the same) ...
  const adminManagerIds = users
    .filter((u) => u.role !== Role.USER)
    .map((u) => u.id);
  if (adminManagerIds.length === 0)
    adminManagerIds.push(faker.helpers.arrayElement(userIds)); // Ensure at least one author if no admins/managers
  const kbArticles = Array.from({ length: 15 }).map(() => {
    const title = faker.lorem.sentence(faker.number.int({ min: 4, max: 10 }));
    return {
      title: title,
      slug:
        faker.helpers.slugify(title).toLowerCase() +
        "-" +
        faker.string.alphanumeric(4), // Add random suffix for uniqueness
      content: faker.lorem.paragraphs(faker.number.int({ min: 5, max: 15 })),
      category: faker.helpers.arrayElement([
        "HR",
        "IT Support",
        "Development",
        "Sales",
        "General",
      ]),
      tags: faker.lorem.words(faker.number.int({ min: 1, max: 4 })).split(" "),
      authorId: faker.helpers.arrayElement(adminManagerIds),
    };
  });
  await prisma.knowledgeBaseArticle.createMany({
    data: kbArticles,
    skipDuplicates: true,
  }); // Skip duplicate slugs
  console.log(`✅ ${kbArticles.length} KB articles created.`);

  console.log(`🌱 Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error("🚨 Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
