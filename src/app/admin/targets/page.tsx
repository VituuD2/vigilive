import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Search, Filter, AlertCircle, User, Radio, Youtube, Twitch, Globe } from 'lucide-react';
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
          <h3 className="font-bold text-lg">Failed to load targets</h3>
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Monitoring Targets</h1>
          <p className="text-muted-foreground">Manage streams and sources you want to monitor.</p>
        </div>
        <TargetDialog />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search targets..."
            className="pl-9 bg-card/50 border-border/50"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Target Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Account / ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Live</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                          {target.id.split('-')[0]}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                      {target.provider}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {target.external_identifier}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        target.status === 'active' ? 'bg-emerald-500 animate-pulse' : 
                        target.status === 'error' ? 'bg-destructive' : 'bg-yellow-500'
                      }`} />
                      <span className="capitalize text-sm">{target.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {target.last_live_at ? new Date(target.last_live_at).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <TargetActionMenu target={target} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                  No monitoring targets found. Click the button above to add your first source.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
