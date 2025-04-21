// components/kudos/KudosCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns'; // For relative time
import { getInitials } from '@/lib/utils/helpers';

// Define a type for the Kudos prop (adapt based on API response)
type KudosProps = {
  kudos: {
    id: string;
    message: string;
    createdAt: string; // Assuming string date from JSON
    giver: {
      id: string;
      name?: string | null;
      image?: string | null;
    };
    receiver: {
      id: string;
      name?: string | null;
      image?: string | null;
    };
  };
};

export function KudosCard({ kudos }: KudosProps) {
    const timeAgo = formatDistanceToNow(new Date(kudos.createdAt), { addSuffix: true });

    return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 bg-muted/30 border-b">
        <div className="flex items-center space-x-3">
           {/* Giver Avatar */}
           <Avatar className="h-9 w-9">
            <AvatarImage src={kudos.giver.image ?? undefined} alt={kudos.giver.name ?? 'Giver'} />
            <AvatarFallback>{getInitials(kudos.giver.name)}</AvatarFallback>
          </Avatar>

          <span className="font-semibold text-sm">{kudos.giver.name || 'Someone'}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
          <span className="font-semibold text-sm">{kudos.receiver.name || 'Someone'}</span>

          {/* Receiver Avatar (Optional) */}
           {/* <Avatar className="h-9 w-9">
            <AvatarImage src={kudos.receiver.image ?? undefined} alt={kudos.receiver.name ?? 'Receiver'} />
            <AvatarFallback>{getInitials(kudos.receiver.name)}</AvatarFallback>
          </Avatar> */}

          <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>

        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm whitespace-pre-wrap">{kudos.message}</p>
      </CardContent>
      {/* Optional Footer */}
      {/* <CardFooter className="p-4 bg-muted/30 border-t">
        <p className="text-xs text-muted-foreground">Footer content if needed</p>
      </CardFooter> */}
    </Card>
  );
}