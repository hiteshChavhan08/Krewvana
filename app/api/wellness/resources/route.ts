// app/api/wellness/resources/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Hardcoded resources for now - replace with DB fetch later
const wellnessResources = [
    { id: 'well1', title: 'Employee Assistance Program (EAP)', description: 'Confidential support for various personal and work-related issues.', url: '#', isInternal: true },
    { id: 'well2', title: 'Mindfulness Meditation Guide', description: 'Learn basic mindfulness techniques.', url: 'https://www.mindful.org/meditation/mindfulness-getting-started/', isInternal: false },
    { id: 'well3', title: 'Tips for Healthy Eating at Work', description: 'Simple ways to maintain a healthy diet during workdays.', url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/healthy-eating-while-working-from-home', isInternal: false },
    { id: 'well4', title: 'Desk Exercise Ideas', description: 'Stay active even while sitting.', url: 'https://www.healthline.com/health/deskercise', isInternal: false },
];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In future: await prisma.wellnessResource.findMany({...});
    return NextResponse.json(wellnessResources);
  } catch (error) {
    console.error("Error fetching wellness resources:", error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}