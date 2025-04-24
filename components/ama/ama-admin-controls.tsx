// src/components/ama-session/ama-admin-controls.tsx
"use client";

import React, { useState } from 'react';
import { AMASessionStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, Square, Loader2 } from 'lucide-react';
import {toast} from 'sonner';
import { AMASessionPageData } from '@/types/types';

interface AmaAdminControlsProps {
    sessionId: string;
    currentStatus: AMASessionStatus;
    // Change the expected signature here to match handleSessionUpdate
    onStatusChange: (updatedData: Partial<AMASessionPageData>) => void;
}


export function AmaAdminControls({ sessionId, currentStatus, onStatusChange }: AmaAdminControlsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const updateStatus = async (newStatus: AMASessionStatus) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/ama/sessions/${sessionId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to update status" }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }

            // Important: Call the callback passed from the parent
            onStatusChange({ status: newStatus });

        } catch (error: any) {
            console.error("Error updating session status:", error);
            toast.error(`Failed to update status: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const canStart = currentStatus === AMASessionStatus.UPCOMING;
    const canEnd = currentStatus === AMASessionStatus.LIVE;

    if (!canStart && !canEnd) {
        return null; // No actions available for current status
    }

    return (
        <Card>
            <CardContent className="pt-6 flex items-center justify-end gap-4">
                 <p className="text-sm text-muted-foreground mr-auto">Admin Controls:</p>
                 {canStart && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateStatus(AMASessionStatus.LIVE)}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        Start Session
                    </Button>
                 )}
                 {canEnd && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
                                End Session
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will end the AMA session. Participants will no longer be able to submit questions.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => updateStatus(AMASessionStatus.ENDED)}
                                disabled={isLoading}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Confirm End Session
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
            </CardContent>
        </Card>
    );
}