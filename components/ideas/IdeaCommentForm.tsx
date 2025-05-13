// components/ideas/IdeaCommentForm.tsx
"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdeaCommentCreateSchema, IdeaCommentCreateData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useSubmitIdeaComment } from "@/hooks/ideas/useIdeaComments";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { SendHorizonal, Loader2 } from "lucide-react";
import Link from "next/link";

interface IdeaCommentFormProps {
  ideaId: string;
  onCommentSubmitted?: () => void;
}

export function IdeaCommentForm({
  ideaId,
  onCommentSubmitted,
}: IdeaCommentFormProps) {
  const currentUser = useCurrentUser();
  const form = useForm<IdeaCommentCreateData>({
    resolver: zodResolver(IdeaCommentCreateSchema),
    defaultValues: {
      content: "",
    },
  });

  const mutation = useSubmitIdeaComment(ideaId);

  const onSubmit = (data: IdeaCommentCreateData) => {
    if (!currentUser) {
      console.error("User not logged in, cannot comment.");
      return;
    }
    mutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onCommentSubmitted?.();
      },
    });
  };

  if (!currentUser) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Please{" "}
        <Link href="/auth/signin" className="underline hover:text-primary">
          log in
        </Link>{" "}
        to post a comment.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-2">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Share your thoughts on this idea..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              mutation.isPending ||
              !form.formState.isValid ||
              !form.getValues("content")?.trim()
            }
            size="sm"
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="mr-2 h-4 w-4" />
            )}
            {mutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
