import { createClient } from '@/lib/supabase/server';
import { Search, AlertCircle, Radio, Youtube, Twitch, Globe, HeartPulse, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TargetDialog } from '@/components/admin/target-dialog';
import { TargetActionMenu } from '@/components/admin/target-action-menu';
import { Target } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default async function TargetsPage() {
  const supabase = await createClient();
  const { data: targets, error } = await supabase
    .from('targets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-destructive/20 rounded-2xl bg-destructive/5 space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <div className="text-center">
          <h3 className="font-bold text-lg">Failed to load fleet</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const typedTargets = (targets as Target[]) || [];

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'youtube': return <Youtube className="h-4 w-4 text-red-500" />;
      case 'twitch': return <Twitch className="h-4 w-4 text-purple-500" />;
      case 'tiktok': return <Radio className="h-4 w-4 text-white" />;
      default: return <Globe className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-primary" />
            Monitoring Fleet
          </h1>
          <p className="text-muted-foreground">Autonomous discovery discovery control plane for external workers.</p>
        </div>
        <TargetDialog />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search monitoring fleet..."
            className="pl-9 bg-card/50 border-border/50"
          />
        </div>
        <Badge variant="outline" className="text-xs border-primary/20 bg-primary/5 text-primary">
          {typedTargets.length} Monitors Configured
        </Badge>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Account Identity</TableHead>
              <TableHead>Probe Health</TableHead>
              <TableHead>Admin Status</TableHead>
              <TableHead>Last Live Session</TableHead>
              <TableHead className="text-right">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedTargets.length > 0 ? (
              typedTargets.map((target) => (
                <TableRow key={target.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center border border-border/50">
                        {getProviderIcon(target.provider)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{target.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          @{target.external_identifier}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            {target.last_discovery_status === 'success' ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            ) : target.last_discovery_status === 'failed' ? (
                              <ShieldAlert className="w-4 h-4 text-destructive" />
                            ) : (
                              <Globe className="w-4 h-4 text-muted-foreground opacity-40" />
                            )}
                            <span className="text-xs capitalize">
                              {target.last_discovery_status || 'idle'}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover border-border max-w-[200px]">
                          <p className="text-xs font-semibold">Discovery Output:</p>
                          <p className="text-[10px] text-muted-foreground break-words">
                            {target.last_discovery_error || (target.last_discovery_status === 'success' ? 'Worker successfully probed source' : 'Waiting for worker sync')}
                          </p>
                          <p className="text-[10px] mt-1 text-accent">Last probe: {target.last_checked_at ? new Date(target.last_checked_at).toLocaleTimeString() : 'Never'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "capitalize text-[10px] border-0 px-0",
                      target.status === 'active' ? 'text-emerald-500' : 'text-muted-foreground'
                    )}>
                      {target.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {target.last_live_at ? new Date(target.last_live_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <TargetActionMenu target={target} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  The fleet is currently empty. Add your first target monitor.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
