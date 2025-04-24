// src/components/ama-session/ama-question-card.tsx
"use client";

import React, { useState } from 'react';
import type { CurrentUserData, AMAQuestionData } from '@/types/types';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Trash2, CornerDownRight, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatTimestamp, getInitials } from '@/lib/utils/ama-utils2';
import {cn} from "@/lib/utils"
import {toast} from 'sonner';
import { BlurFade } from "@/components/magicui/blur-fade"; // Magic UI example

interface AmaQuestionCardProps {
    question: AMAQuestionData;
    currentUser: CurrentUserData;
    isHostOrAdmin: boolean;
    onQuestionAnswered: (updatedQuestion: AMAQuestionData) => void;
    onQuestionDeleted: (deletedQuestionId: string) => void;
}

export function AmaQuestionCard({
    question,
    currentUser,
    isHostOrAdmin,
    onQuestionAnswered,
    onQuestionDeleted
}: AmaQuestionCardProps) {
    const [isAnswering, setIsAnswering] = useState(false);
    const [answerText, setAnswerText] = useState('');
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const canAnswer = isHostOrAdmin;
    const canDelete = isHostOrAdmin || currentUser.id === question.submittedById;
    const submitter = question.isAnonymous ? null : question.submittedBy;
    const submitterName = question.isAnonymous ? "Anonymous" : (submitter?.name ?? "Deleted User");

    const handleAnswerSubmit = async () => {
        if (!answerText.trim()) {
            toast.error("Answer cannot be empty.");
            return;
        }
        setIsSubmittingAnswer(true);
        const toastId = toast.loading("Submitting answer...");
        try {
            const response = await fetch(`/api/ama/questions/${question.id}/answer`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answerText }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to submit answer" }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            const updatedQuestion: AMAQuestionData = await response.json();
            onQuestionAnswered(updatedQuestion); // Update parent state
            setIsAnswering(false);
            setAnswerText('');
            toast.success("Answer submitted!", { id: toastId });

        } catch (error: any) {
            console.error("Error submitting answer:", error);
            toast.error(`Failed to submit answer: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmittingAnswer(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        const toastId = toast.loading("Deleting question...");
        try {
             const response = await fetch(`/api/ama/questions/${question.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Handle cases like 204 No Content which are okay
                if (response.status === 204) {
                     onQuestionDeleted(question.id); // Update parent state
                     toast.success("Question deleted.", { id: toastId });
                     return; // Success
                }
                const errorData = await response.json().catch(() => ({ message: "Failed to delete question" }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }

            // Handle potential 200 OK with message if API returns that
            onQuestionDeleted(question.id); // Update parent state
            toast.success("Question deleted.", { id: toastId });

        } catch (error: any) {
            console.error("Error deleting question:", error);
            toast.error(`Failed to delete: ${error.message}`, { id: toastId });
        } finally {
            setIsDeleting(false);
            // No need to close dialog here, AlertDialog handles it on action click
        }
    };

    return (
        // Wrap with Magic UI BlurIn for entry animation
         <BlurFade delay={0.1} duration={0.5}>
            <Card className="break-inside-avoid"> {/* Avoid breaking card across columns if using masonry later */}
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6">
                            {/* Show generic user icon if anonymous or deleted */}
                            <AvatarImage src={!question.isAnonymous ? submitter?.image ?? undefined : undefined} alt={submitterName} />
                            <AvatarFallback className={cn("text-xs", (question.isAnonymous || !submitter) && "bg-muted")}>
                                {question.isAnonymous || !submitter ? <User className="h-3 w-3" /> : getInitials(submitterName)}
                            </AvatarFallback>
                        </Avatar>
                        <span className={cn("font-medium", (question.isAnonymous || !submitter) && "italic")}>
                            {submitterName}
                        </span>
                        <span>·</span>
                        <span>{formatTimestamp(question.createdAt)}</span>
                    </div>
                </CardHeader>
                <CardContent className="pb-4">
                    <p className="text-base text-foreground whitespace-pre-wrap">
                        {question.text}
                    </p>
                </CardContent>

                {/* Answer Section */}
                {question.answerText && (
                    <CardFooter className="flex flex-col items-start gap-3 pt-0 pb-4 border-t mt-2 pt-4">
                         <div className="flex items-center gap-2 text-sm w-full">
                             <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={question.answeredBy?.image ?? undefined} alt={question.answeredBy?.name ?? 'Host/Admin'} />
                                <AvatarFallback className="text-xs">{getInitials(question.answeredBy?.name ?? 'A')}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground/90">
                                {question.answeredBy?.name ?? 'Host/Admin'} answered
                            </span>
                             <span className="text-muted-foreground ml-auto">{formatTimestamp(question.answeredAt)}</span>
                        </div>
                        <p className="text-base text-muted-foreground pl-6 whitespace-pre-wrap">
                            {question.answerText}
                        </p>
                    </CardFooter>
                )}

                {/* Actions Footer */}
                {(canAnswer || canDelete) && !question.answerText && !isAnswering && (
                     <CardFooter className={cn("pt-3 flex justify-end gap-2", question.answerText ? 'border-t' : '')}>
                        {canAnswer && !question.answerText && (
                            <Button variant="outline" size="sm" onClick={() => setIsAnswering(true)}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Answer
                            </Button>
                        )}
                        {canDelete && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. The question will be permanently removed.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteConfirm}
                                        disabled={isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirm Delete
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </CardFooter>
                )}

                 {/* Answering Form */}
                {isAnswering && (
                    <CardFooter className="flex flex-col items-start gap-3 pt-3 border-t">
                        <Textarea
                            placeholder="Your answer..."
                            rows={3}
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            disabled={isSubmittingAnswer}
                            className="w-full"
                        />
                        <div className="flex justify-end gap-2 w-full">
                             <Button variant="ghost" size="sm" onClick={() => setIsAnswering(false)} disabled={isSubmittingAnswer}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleAnswerSubmit} disabled={isSubmittingAnswer}>
                                {isSubmittingAnswer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Answer
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
         </BlurFade>
    );
}