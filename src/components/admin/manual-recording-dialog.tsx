'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Video } from 'lucide-react';
import { manualEnqueueRecording } from '@/lib/actions/recordings';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Target } from '@/types/database';

const manualSchema = z.object({
  title: z.string().optional(),
  streamUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ManualFormValues = z.infer<typeof manualSchema>;

interface ManualRecordingDialogProps {
  target: Target;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualRecordingDialog({ target, open, onOpenChange }: ManualRecordingDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      title: '',
      streamUrl: '',
    },
  });

  function onSubmit(values: ManualFormValues) {
    startTransition(async () => {
      try {
        await manualEnqueueRecording(target.id, values.title, values.streamUrl);
        toast({ title: 'Recording enqueued', description: 'Cloud worker will pick up this job shortly.' });
        onOpenChange(false);
        form.reset();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Manual Ingest
          </DialogTitle>
          <DialogDescription>
            Force start a recording job for <strong>{target.name}</strong>. Use this if auto-detection is failing.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Special Event Capture" {...field} className="bg-background/50" />
                  </FormControl>
                  <FormDescription>Leave blank for default naming.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="streamUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Override Stream URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://.../playlist.m3u8" {...field} className="bg-background/50" />
                  </FormControl>
                  <FormDescription>
                    Provide a direct manifest URL if you have it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Recording Job
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
