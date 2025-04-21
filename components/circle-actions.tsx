// app/app/mentorship/circles/[circleId]/_components/circle-actions.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MembershipStatus, MentorshipCircleStatus, MentorshipRole } from '@prisma/client'; // Import Enums
import { LogOut, UserPlus, Edit, Play, Check, X, Clock, AlertTriangle } from 'lucide-react'; // Icons
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"; // Import tooltip wrapper
import { Loader2 } from "lucide-react"; // Spinner icon

// --- Type Definitions ---
type CircleActionData = {
  id: string;
  status: MentorshipCircleStatus;
  maxMentees: number | null;
  _count: { members: number };
};

type MembershipInfo = {
  id: string;
  userId: string;
  circleId: string;
  role: MentorshipRole;
  status: MembershipStatus;
} | null;

interface CircleActionsProps {
  circle: CircleActionData;
  currentUserMembership: MembershipInfo;
  isMentor: boolean;
  isAdmin: boolean;
}

// --- Component Implementation ---
export function CircleActions({ circle, currentUserMembership, isMentor, isAdmin }: CircleActionsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<boolean | string>(false); // Track specific actions by string key
    const [isAlertOpen, setIsAlertOpen] = useState<{ [key: string]: boolean }>({}); // Track open state per alert type

    // --- API Call Helper ---
    const handleApiCall = async (
        action: () => Promise<Response>,
        loadingMessage: string,
        successMessage: string,
        errorMessagePrefix: string,
        actionType: string
     ) => {
        setIsLoading(actionType); // Set loading state for this specific action
        const toastId = toast.loading(loadingMessage);
        try {
            const response = await action();
            if (!response.ok) {
                let errorMsg = `Error ${response.status}`;
                try { const data = await response.json(); errorMsg = data.message || errorMsg; } catch (_) {}
                throw new Error(errorMsg);
            }
            toast.success(successMessage, { id: toastId });
            router.refresh(); // Re-fetch server data after successful action
        } catch (error: any) {
            console.error(`${errorMessagePrefix} error:`, error);
            toast.error(`${errorMessagePrefix}: ${error.message}`, { id: toastId });
        } finally {
            setIsLoading(false); // Reset general loading state
             // Close any related alert dialog by resetting its specific state
             setIsAlertOpen(prev => ({ ...prev, [actionType]: false }));
        }
    };

    // --- Specific Action Handlers ---
    const handleJoin = () => handleApiCall(
        () => fetch(`/api/mentorship/circles/${circle.id}/join`, { method: 'POST' }),
        "Requesting to join...", "Request sent! The mentor will review it.", "Join failed", "join"
    );

    const handleLeave = () => {
        if (!currentUserMembership) return; // Should not happen if button is visible
        handleApiCall(
            () => fetch(`/api/mentorship/circles/${circle.id}/members/${currentUserMembership.id}`, { method: 'DELETE' }),
            "Leaving circle...", "You have left the circle.", "Leave failed", "leave"
        );
    };

    const updateCircleStatus = (newStatus: MentorshipCircleStatus) => handleApiCall(
        () => fetch(`/api/mentorship/circles/${circle.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        }),
        `Updating status to ${newStatus.toLowerCase()}...`, `Circle status updated to ${newStatus.toLowerCase()}.`, "Status update failed", `status_${newStatus}`
    );


    // --- Button Rendering Logic ---
    const canJoin = !currentUserMembership &&
                   (circle.status === MentorshipCircleStatus.FORMING || circle.status === MentorshipCircleStatus.ACTIVE) &&
                   (circle.maxMentees === null || circle._count.members < circle.maxMentees);

    const isPending = currentUserMembership?.status === MembershipStatus.PENDING;
    const isActiveMember = currentUserMembership?.status === MembershipStatus.ACTIVE;
    const isActionLoading = (actionType: string) => isLoading === actionType;
    // Helper to check if *any* action is loading
    const isAnyLoading = !!isLoading;

    // --- JSX ---
    return (
        <div className='flex items-center gap-2 flex-shrink-0'> {/* Prevent shrinking on smaller screens */}
            {/* Join / Pending Button */}
            {canJoin && (
                <TooltipWrapper tooltipText="Send a request to join this circle">
                <Button onClick={handleJoin} disabled={isAnyLoading} size="sm">
                    {isActionLoading('join') ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1.5 h-4 w-4" />}
                    Request to Join
                </Button>
            </TooltipWrapper>
            )}
            {isPending && (
                <Button variant="outline" disabled size="sm">
                    <Clock className="mr-1.5 h-4 w-4" /> Request Pending
                </Button>
            )}

            {/* Leave Button with Confirmation */}
            {isActiveMember && (
                <AlertDialog open={isAlertOpen['leave']} onOpenChange={(open) => setIsAlertOpen(prev => ({...prev, leave: open}))}>
                <TooltipWrapper tooltipText="Leave this mentorship circle">
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={isAnyLoading} size="sm">
                            <LogOut className="mr-1.5 h-4 w-4" /> Leave
                        </Button>
                    </AlertDialogTrigger>
                </TooltipWrapper>
                {/* ... AlertDialogContent ... */}
                <AlertDialogContent>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogFooter>
                        <AlertDialogCancel disabled={isActionLoading('leave')}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLeave} disabled={isActionLoading('leave')} /* ... */>
                            {isActionLoading('leave') ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/> : "Yes, Leave"}
                        </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
                {/* ... */}
            </AlertDialog>
            )}


             {/* Mentor/Admin Actions Dropdown */}
             {(isMentor || isAdmin) && (
                <DropdownMenu>
                    <TooltipWrapper tooltipText="Manage this circle (Mentor actions)">
                    <DropdownMenuTrigger asChild>
                         <Button variant="secondary" size="sm" disabled={!!isLoading}> {/* Use size="sm" */}
                            <Edit className="h-4 w-4 mr-1.5" /> Manage
                            {/* <span className="sr-only">Manage Circle</span> */}
                         </Button>
                    </DropdownMenuTrigger>
                    </TooltipWrapper>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Mentor Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                         {/* Activate Button */}
                         {circle.status === MentorshipCircleStatus.FORMING && (
                             <DropdownMenuItem onClick={() => updateCircleStatus(MentorshipCircleStatus.ACTIVE)} disabled={isLoading === 'status_ACTIVE'} >
                                 {isLoading === 'status_ACTIVE' ? <Clock className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" />} Activate Circle
                             </DropdownMenuItem>
                         )}

                         {/* Complete Button */}
                          {circle.status === MentorshipCircleStatus.ACTIVE && (
                            <DropdownMenuItem onClick={() => updateCircleStatus(MentorshipCircleStatus.COMPLETED)} disabled={isLoading === 'status_COMPLETED'} >
                                {isLoading === 'status_COMPLETED' ? <Clock className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />} Mark as Complete
                            </DropdownMenuItem>
                         )}

                         {/* Cancel Button with Confirmation */}
                         {(circle.status === MentorshipCircleStatus.FORMING || circle.status === MentorshipCircleStatus.ACTIVE) && (
                            <AlertDialog open={isAlertOpen['cancel']} onOpenChange={(open) => setIsAlertOpen(prev => ({...prev, cancel: open}))}>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={(e) => e.preventDefault()} disabled={!!isLoading} >
                                        <X className="mr-2 h-4 w-4" /> Cancel Circle
                                     </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader> <AlertDialogTitle>Cancel Mentorship Circle?</AlertDialogTitle> <AlertDialogDescription> This action cannot be undone. The circle will be marked as cancelled. Are you sure? </AlertDialogDescription> </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isLoading === 'status_CANCELLED'}>Back</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => updateCircleStatus(MentorshipCircleStatus.CANCELLED)} disabled={isLoading === 'status_CANCELLED'} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" > {isLoading === 'status_CANCELLED' ? "Cancelling..." : "Yes, Cancel Circle"} </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         )}
                    </DropdownMenuContent>
                </DropdownMenu>
             )}
        </div>
    );
}