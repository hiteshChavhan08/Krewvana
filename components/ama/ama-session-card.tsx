import { formatShortDate, formatTime } from "@/lib/utils/date-helpers";
import { getAMAStatusBadgeVariant, getInitials } from "@/lib/utils/helpers";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { Calendar, Clock, Mic, HelpCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusText } from "@/lib/utils/get_status";
import { AMASessionData } from "@/types/types";
import Link from "next/link";
// --- Define Session Type expected from API ---

// --- Reusable Session Card ---
export function AMASessionCard({ session }: { session: AMASessionData }) {
  return (
    <Link
      href={`/app/ama/${session.id}`}
      className="block hover:shadow-lg transition-shadow duration-200 rounded-lg"
    >
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start gap-2 mb-1">
            <CardTitle className="text-lg font-semibold">
              {session.title}
            </CardTitle>
            <Badge
              variant={getAMAStatusBadgeVariant(session.status)}
              className="capitalize text-xs whitespace-nowrap"
            >
              {getStatusText(session.status)}
            </Badge>
          </div>
          {session.isTechSpecific && session.topic && (
            <Badge variant="outline" className="w-fit text-xs">
              {session.topic}
            </Badge>
          )}
          {session.description && (
            <CardDescription className="text-sm text-muted-foreground pt-1 line-clamp-2">
              {session.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow text-sm text-muted-foreground space-y-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatShortDate(session.scheduledAt)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>{formatTime(session.scheduledAt)}</span>
          </div>
          <div className="flex items-center">
            <Mic className="h-4 w-4 mr-2" /> Hosted by
            <Avatar className="h-5 w-5 ml-1.5 mr-1">
              <AvatarImage src={session.host.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(session.host.name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground/90">
              {session.host.name ?? "Host"}
            </span>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground flex justify-between items-center">
          <div className="flex items-center">
            <HelpCircle className="h-3.5 w-3.5 mr-1" />
            <span>
              {session._count.questions} Question
              {session._count.questions !== 1 ? "s" : ""}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
