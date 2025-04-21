// app/app/mentorship/circles/[circleId]/_components/member-list.tsx
'use client';

import { useState } from 'react';
// ... other imports
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

// Types remain the same...
import { MentorshipRole, MembershipStatus } from '@prisma/client'; // Make sure to import enums

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Check, Clock, UserCheck, Users, UserX, X } from 'lucide-react';
import { toast} from "sonner"
import { useRouter } from 'next/navigation';
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"; // Import tooltip
import { Loader2 } from "lucide-react"; // Spinner

// Data structure for displaying each member in the list
// This comes from the 'members' array included in the circle details fetch
type MemberDisplayData = {
  id: string; // Membership ID (MentorshipCircleMember record ID)
  role: MentorshipRole; // Enum: MENTOR or MENTEE
  status: MembershipStatus; // Enum: PENDING, ACTIVE, DECLINED, etc.
  joinedAt: Date | string; // Date object if directly from Prisma in RSC, string if serialized
  user: { // Nested user details
    id: string; // User ID
    name: string | null;
    image: string | null;
    email: string | null; // Included for display/contact
  };
};

// Information about the *currently viewing* user's membership in this specific circle
// Can be null if the viewing user is not a member
type MembershipInfo = {
  id: string; // The ID of the MentorshipCircleMember record for the viewing user
  userId: string; // The ID of the viewing user
  circleId: string; // Should match the circle being viewed
  role: MentorshipRole; // Role of the viewing user
  status: MembershipStatus; // Status of the viewing user's membership
} | null; // Use null if the user is not a member of this circle

// Interface defining the props required by the MemberList component
interface MemberListProps {
  circleId: string; // ID of the circle, needed for API calls within the component
  members: MemberDisplayData[]; // The array of all members associated with the circle
  currentUserMembership: MembershipInfo; // The viewing user's membership details (or null)
  isMentor: boolean; // Convenience flag: Is the viewing user an active mentor here?
  isAdmin: boolean; // Convenience flag: Is the viewing user an admin? (For future use)
}

export function MemberList({ circleId, members, currentUserMembership, isMentor, isAdmin }: MemberListProps) {
    const router = useRouter();
    const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
    // State to manage which remove alert is open, keyed by memberId
    const [removeAlertOpen, setRemoveAlertOpen] = useState<{ [key: string]: boolean }>({});

    // handleApprove, handleDecline remain the same...
    const handleApprove = async (memberId: string) => { /* ... */ };
    const handleDecline = async (memberId: string) => { /* ... */ };


    // handleRemove - modified to use the alert dialog pattern
    const handleRemove = async (memberId: string) => {
        setLoadingMemberId(memberId);
        const toastId = toast.loading("Removing member...");
        try {
            const response = await fetch(`/api/mentorship/circles/${circleId}/members/${memberId}`, { method: 'DELETE' });
            if (!response.ok) {
                let errorMsg = `Error ${response.status}`;
                try { const data = await response.json(); errorMsg = data.message || errorMsg; } catch (_) {}
                throw new Error(errorMsg);
            }
            toast.success("Member removed.", { id: toastId });
             setRemoveAlertOpen(prev => ({ ...prev, [memberId]: false })); // Close the specific alert
            router.refresh();
        } catch (error: any) {
            toast.error(`Remove failed: ${error.message}`, { id: toastId });
        } finally {
            setLoadingMemberId(null);
        }
    };

    // Filtered member lists remain the same...
    const activeMentees = members.filter(member =>
        member.role === MentorshipRole.MENTEE && member.status === MembershipStatus.ACTIVE
    );
    // Filter for mentees who have a PENDING status (awaiting approval)
    const pendingMentees = members.filter(member =>
        member.role === MentorshipRole.MENTEE && member.status === MembershipStatus.PENDING
    );
// Helper for loading state
const isMemberLoading = (memberId: string) => loadingMemberId === memberId;

    return (
        <Card>
            {/* ... CardHeader ... */}
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><Users className="h-5 w-5 mr-2 text-primary"/> Mentees</CardTitle>
                <CardDescription>Current and pending members seeking mentorship.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Pending Requests Section */}
                {pendingMentees.length > 0 && (
                    <div>
                        {/* ... Pending header ... */}
                        <h3 className="text-md font-semibold mb-3 flex items-center"><Clock className="h-4 w-4 mr-2 text-secondary-foreground"/>Pending Requests ({pendingMentees.length})</h3>
                        <div className="space-y-3">
                            {pendingMentees.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 border rounded bg-muted/40">
                                    {/* ... Member info ... */}
                                    <div key={member.id} className="flex items-center justify-between p-3 border rounded bg-muted/40">
                                    {(isMentor || isAdmin) && (
                                        <div className="flex gap-2">
                                            <TooltipWrapper tooltipText="Approve Request">
                                             <Button /* Approve Button */ onClick={() => handleApprove(member.id)} disabled={loadingMemberId === member.id}> <Check/> </Button>
                                             </TooltipWrapper>
                                             <TooltipWrapper tooltipText="Decline Request">
                                             <Button /* Decline Button */ onClick={() => handleDecline(member.id)} disabled={loadingMemberId === member.id}> <X/> </Button>
                                             </TooltipWrapper>
                                        </div>
                                    )}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Mentees Section */}
                 <div>
                     {/* ... Active header ... */}
                     <div>
                     <h3 className="text-md font-semibold mb-3 flex items-center"><UserCheck className="h-4 w-4 mr-2 text-success-foreground"/>Active Mentees ({activeMentees.length})</h3>
                    {activeMentees.length > 0 ? (
                        <div className="space-y-3">
                            {activeMentees.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                                     {/* ... Member info ... */}
                                     {(isMentor || isAdmin) && currentUserMembership?.userId !== member.user.id && (
                                         <AlertDialog open={removeAlertOpen[member.id]} onOpenChange={(open) => setRemoveAlertOpen(prev => ({...prev, [member.id]: open}))}>
                                            <TooltipWrapper tooltipText="Remove Member">
                                             <AlertDialogTrigger asChild>
                                                 <Button
                                                     size="sm"
                                                     variant="ghost"
                                                     className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                     disabled={loadingMemberId === member.id}
                                                     aria-label={`Remove ${member.user.name ?? 'member'}`}
                                                >
                                                     <UserX className="h-4 w-4" />
                                                 </Button>
                                             </AlertDialogTrigger>
                                             </TooltipWrapper>
                                             <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove {member.user.name ?? 'this member'}?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to remove this member from the circle? They will lose access and may need to rejoin.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={loadingMemberId === member.id}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleRemove(member.id)}
                                                        disabled={loadingMemberId === member.id}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        {loadingMemberId === member.id ? "Removing..." : "Yes, Remove"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                             </AlertDialogContent>
                                         </AlertDialog>
                                     )}
                                </div>
                            ))}
                        </div>
                    ) : ( <p className="text-sm text-muted-foreground">No active mentees yet.</p> )}
                </div>
                </div>

                {/* Message if no mentees at all */}
                {activeMentees.length === 0 && pendingMentees.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center pt-4">No mentees have joined or requested to join yet.</p>
                )}
            </CardContent>
        </Card>
    );
}