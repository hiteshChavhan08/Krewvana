// FILE: components/shared/Metric.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MetricProps {
  icon: React.ReactNode;
  value: number | string;
  title: string;
  href?: string;
  textStyles?: string;
  isAuthor?: boolean;
}

const Metric = ({
  icon,
  value,
  title,
  href,
  textStyles,
  isAuthor,
}: MetricProps) => {
  const metricContent = (
    <>
      {icon}
      <p className={cn("flex items-center gap-1", textStyles)}>
        {value}
        <span className={cn("hidden sm:inline ml-1", { 'max-sm:hidden': isAuthor })}>
          {title}
        </span>
         <span className="sm:hidden ml-1"> {/* Show abbreviation on small screens */}
          {title.split(' ')[0]}
        </span>
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex justify-center gap-1 rounded-full px-2 py-1 hover:bg-muted transition-colors">
        {metricContent}
      </Link>
    );
  }

  return (
    <div className="flex justify-center gap-1 rounded-full px-2 py-1">
      {metricContent}
    </div>
  );
};

export default Metric;