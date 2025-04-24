// src/components/ama-session/ama-session-display-header.tsx
import React from 'react';
import type { AMASessionPageData } from '@/types/types'; // Use your defined types
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Mic } from "lucide-react";
import { formatTimestamp, getInitials, getStatusBadgeVariant, getStatusText } from '@/lib/utils/ama-utils2'; // Use your defined helpers

interface AmaSessionDisplayHeaderProps {
    session: AMASessionPageData;
}

export function AmaSessionDisplayHeader({ session }: AmaSessionDisplayHeaderProps) {
    const hostName = session.host?.name ?? 'Host';

    return (
        <Card className="overflow-hidden">
            {/* Optional: Aceternity BackgroundGradient */}
            {/* <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-white dark:bg-zinc-900"> */}
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {session.title}
                    </CardTitle>
                    <Badge
                        variant={getStatusBadgeVariant(session.status)}
                        className="text-xs uppercase tracking-wider whitespace-nowrap"
                    >
                        {getStatusText(session.status)}
                    </Badge>
                </div>
                {session.description && (
                    <CardDescription className="text-base">
                        {session.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground pt-0">
                 <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{formatTimestamp(session.scheduledAt, 'short')}</span>
                </div>
                <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{formatTimestamp(session.scheduledAt, 'long').split(' at ')[1]}</span> {/* Extract time part */}
                </div>
                 <div className="flex items-center">
                    <Mic className="h-4 w-4 mr-2 flex-shrink-0" />
                    Hosted by
                    <Avatar className="h-6 w-6 ml-1.5 mr-1">
                        <AvatarImage src={session.host?.image ?? undefined} alt={hostName} />
                        <AvatarFallback className="text-xs">{getInitials(hostName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground/90">
                        {hostName}
                    </span>
                </div>
            </CardContent>
            {/* </BackgroundGradient> */}
        </Card>
    );
}