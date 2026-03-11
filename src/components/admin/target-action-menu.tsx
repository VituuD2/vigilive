'use client';

import { useTransition, useState } from 'react';
import { MoreVertical, Play, Pause, Trash2, Loader2, Beaker, PlusSquare, ShieldCheck } from 'lucide-react';
import { updateTargetStatus, deleteTarget, testTargetDetection } from '@/lib/actions/targets';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
        toast({ title: `Monitor ${newStatus === 'active' ? 'resumed' : 'paused'}` });
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
          title: result.isLive ? 'Target is LIVE' : (result.diagnostics?.some(d => !d.success) ? 'Detection FAILED' : 'Target is OFFLINE'),
          description: result.isLive 
            ? 'Autonomous recording will trigger automatically.' 
            : `Health check: ${result.diagnostics?.find(d => !d.success)?.message || 'No specific issues detected.'}`,
          variant: result.isLive ? 'default' : (result.diagnostics?.some(d => !d.success) ? 'destructive' : 'default')
        });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Test failed', description: e.message });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this target?')) return;
    
    startTransition(async () => {
      try {
        await deleteTarget(target.id);
        toast({ title: 'Target removed from fleet' });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete failed', description: e.message });
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isPending}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border/50 min-w-[180px]">
          <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Autonomous Controls</DropdownMenuLabel>
          {target.status !== 'active' ? (
            <DropdownMenuItem onClick={() => handleStatusChange('active')} className="gap-2 cursor-pointer">
              <Play className="w-3.5 h-3.5 text-emerald-500" /> Resume Monitoring
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleStatusChange('paused')} className="gap-2 cursor-pointer">
              <Pause className="w-3.5 h-3.5 text-yellow-500" /> Pause Monitoring
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleTestDetection} className="gap-2 cursor-pointer">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Run Health Check
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-border/40" />
          <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Overrides</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => setIsManualOpen(true)} className="gap-2 cursor-pointer">
            <PlusSquare className="w-3.5 h-3.5 text-primary" /> Manual Ingest
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border/40" />
          
          <DropdownMenuItem 
            onClick={handleDelete}
            className="gap-2 text-destructive focus:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove Target
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
