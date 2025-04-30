// components/profile/ProfileSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

export const ProfileSkeleton = () => (
  <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
    {/* Header Skeleton */}
    <div className="flex items-center space-x-4">
      <Skeleton className="h-24 w-24 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" /> <Skeleton className="h-4 w-64" /> <Skeleton className="h-4 w-40" />
      </div>
       <Skeleton className="h-9 w-24 ml-auto" />
    </div>

    {/* Bento Grid Skeleton */}
    <BentoGrid className="max-w-4xl mx-auto auto-rows-auto md:auto-rows-[14rem]">
        {/* Points Item Skeleton - Content in Header */}
        <BentoGridItem
            key="points-sk" title="Total Points" icon={<Skeleton className="h-4 w-4 rounded-full"/>}
            header={<div className="flex flex-1 w-full h-full items-center justify-center"><Skeleton className="h-12 w-24" /></div>}
            className="md:col-span-1"
        />
         {/* Badges Item Skeleton - Content in Header */}
         <BentoGridItem
            key="badges-sk" title="Earned Badges" icon={<Skeleton className="h-4 w-4 rounded-full"/>}
            header={<div className="flex flex-wrap gap-2 p-4"><Skeleton className="h-6 w-20"/><Skeleton className="h-6 w-24"/></div>}
             className="md:col-span-1"
        />
        {/* Placeholder Item Skeleton */}
         <BentoGridItem
            key="placeholder-sk" title={<Skeleton className="h-5 w-20"/>} description={<Skeleton className="h-4 w-32"/>}
            header={<Skeleton className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl" />}
            icon={<Skeleton className="h-4 w-4 rounded-full"/>}
             className="md:col-span-1"
        />
        {/* About Me Item Skeleton - Content in Header */}
        <BentoGridItem
            key="about-sk" title="About Me" icon={<Skeleton className="h-4 w-4 rounded-full"/>}
            header={
                <div className="space-y-4 p-4"> {/* Simulate AboutMe content */}
                    <Skeleton className="h-5 w-1/4"/> <Skeleton className="h-4 w-full"/>
                    <Skeleton className="h-5 w-1/4 mt-2"/> <Skeleton className="h-4 w-3/4"/>
                    <Skeleton className="h-5 w-1/4 mt-2"/> <Skeleton className="h-4 w-full"/>
                     <Skeleton className="h-9 w-28 mt-4" />
                </div>
            }
            className="md:col-span-2 md:row-span-2 items-start" // Align content top
        />
         {/* Placeholder Item Skeleton */}
         <BentoGridItem
            key="placeholder2-sk" title={<Skeleton className="h-5 w-24"/>} description={<Skeleton className="h-4 w-40"/>}
            header={<Skeleton className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl" />}
            icon={<Skeleton className="h-4 w-4 rounded-full"/>}
             className="md:col-span-1 md:row-span-2"
        />
    </BentoGrid>
  </div>
);