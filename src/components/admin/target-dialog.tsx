
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2, Globe } from 'lucide-react';
import { createTarget } from '@/lib/actions/targets';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const targetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.enum(['youtube', 'twitch', 'rtmp', 'tiktok']),
  external_identifier: z.string().min(1, 'Source Identifier is required'),
});

type TargetFormValues = z.infer<typeof targetSchema>;

export function TargetDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<TargetFormValues>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      name: '',
      provider: 'tiktok',
      external_identifier: '',
    },
  });

  function onSubmit(values: TargetFormValues) {
    startTransition(async () => {
      try {
        await createTarget(values);
        toast({ title: 'Target added', description: 'Monitoring engine has been notified.' });
        setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Target
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>New Monitor</DialogTitle>
          <DialogDescription>
            Add any live stream source to your autonomous monitor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friendly Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Creator's Main" {...field} className="bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok (Public Scraper)</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="twitch">Twitch</SelectItem>
                      <SelectItem value="rtmp">Custom RTMP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="external_identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch('provider') === 'tiktok' ? 'TikTok @Username' : 'ID / URL'}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={form.watch('provider') === 'tiktok' ? '@username' : 'Identifier'} {...field} className="bg-background/50" />
                  </FormControl>
                  <FormDescription>
                    {form.watch('provider') === 'tiktok' && 'No official API credentials needed.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Target
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
