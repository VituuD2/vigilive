'use client';

import { useTransition, useState } from 'react';
import { MoreVertical, Play, Pause, Trash2, Loader2, Beaker, PlusSquare } from 'lucide-react';
import { updateTargetStatus, deleteTarget, testTargetDetection } from '@/lib/actions/targets';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Target } from '@/types/database';
import { ManualRecordingDialog } from './manual-recording-dialog';

export function TargetActionMenu({ target }: { target: Target }) {
  const [isPending, startTransition] = useTransition();
  const [isManualOpen, setIsManualOpen] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = (newStatus: 'active' | 'paused') => {
    startTransition(async () => {
      try {
        await updateTargetStatus(target.id, newStatus);
        toast({ title: `Target ${newStatus === 'active' ? 'resumed' : 'paused'}` });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action failed', description: e.message });
      }
    });
  };

  const handleTestDetection = () => {
    startTransition(async () => {
      try {
        const result = await testTargetDetection(target.id);
        toast({ 
          title: result.isLive ? 'Target is LIVE' : 'Target is OFFLINE',
          description: result.isLive 
            ? 'Detection successful. Manual record is possible.' 
            : `Diagnostics: ${result.diagnostics?.find(d => !d.success)?.message || 'No specific errors.'}`,
          variant: result.isLive ? 'default' : 'destructive'
        });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Test failed', description: e.message });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this target? All associated history will be lost.')) return;
    
    startTransition(async () => {
      try {
        await deleteTarget(target.id);
        toast({ title: 'Target deleted successfully' });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete failed', description: e.message });
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isPending}>
          <Button variant="ghost" size="icon">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border/50">
          {target.status !== 'active' ? (
            <DropdownMenuItem onClick={() => handleStatusChange('active')} className="gap-2 cursor-pointer">
              <Play className="w-4 h-4 text-emerald-500" /> Start Monitor
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleStatusChange('paused')} className="gap-2 cursor-pointer">
              <Pause className="w-4 h-4 text-yellow-500" /> Pause Monitor
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator className="bg-border/40" />
          
          <DropdownMenuItem onClick={handleTestDetection} className="gap-2 cursor-pointer">
            <Beaker className="w-4 h-4 text-accent" /> Test Discovery
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setIsManualOpen(true)} className="gap-2 cursor-pointer">
            <PlusSquare className="w-4 h-4 text-primary" /> Manual Record
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border/40" />
          
          <DropdownMenuItem 
            onClick={handleDelete}
            className="gap-2 text-destructive focus:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Target
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManualRecordingDialog 
        target={target} 
        open={isManualOpen} 
        onOpenChange={setIsManualOpen} 
      />
    </>
  );
}
