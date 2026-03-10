
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2, Info } from 'lucide-react';
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
import { TikTokProfileSearch } from './tiktok-profile-search';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const targetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.enum(['youtube', 'twitch', 'rtmp', 'tiktok']),
  external_identifier: z.string().min(1, 'Source ID is required'),
  platform_user_id: z.string().optional(),
  display_name: z.string().optional(),
  avatar_url: z.string().optional(),
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
      provider: 'youtube',
      external_identifier: '',
    },
  });

  const selectedProvider = form.watch('provider');

  function onSubmit(values: TargetFormValues) {
    startTransition(async () => {
      try {
        await createTarget(values);
        toast({ title: 'Target created', description: 'Stream monitoring will begin shortly.' });
        setOpen(false);
        form.reset();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Operation failed',
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
          Add New Target
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>New Monitoring Target</DialogTitle>
          <DialogDescription>
            Configure a new live stream source for automated recording.
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
                    <Input placeholder="Downtown Intersection Cam" {...field} className="bg-background/50" />
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
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue('external_identifier', '');
                      form.setValue('platform_user_id', '');
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube Live</SelectItem>
                      <SelectItem value="twitch">Twitch</SelectItem>
                      <SelectItem value="tiktok">TikTok Live</SelectItem>
                      <SelectItem value="rtmp">Custom RTMP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedProvider === 'tiktok' ? (
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Search TikTok Account</FormLabel>
                  <FormControl>
                    <TikTokProfileSearch 
                      onSelect={(profile) => {
                        form.setValue('external_identifier', profile.username);
                        form.setValue('platform_user_id', profile.id);
                        form.setValue('display_name', profile.display_name);
                        form.setValue('avatar_url', profile.avatar_url);
                        if (!form.getValues('name')) {
                          form.setValue('name', profile.display_name);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Only authorized accounts via the official TikTok Research API are listed.
                  </FormDescription>
                </FormItem>
                
                <Alert className="bg-accent/5 border-accent/20">
                  <Info className="h-4 w-4 text-accent" />
                  <AlertTitle className="text-xs font-bold text-accent">Integration Pending</AlertTitle>
                  <AlertDescription className="text-[10px] text-muted-foreground">
                    Live capture for TikTok requires a Webhook URL and a valid App Client Secret in your production settings.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="external_identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source ID / URL</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. dQw4w9WgXcQ" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Target
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
