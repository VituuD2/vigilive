import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target as TargetIcon, Video, Activity, Zap, Radio, History, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Target, SystemLog } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { count: targetsCount } = await supabase.from('targets').select('*', { count: 'exact', head: true });
  const { count: activeTargets } = await supabase.from('targets').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: recordingsCount } = await supabase.from('recordings').select('*', { count: 'exact', head: true });
  const { count: activeRecordings } = await supabase.from('recordings').select('*', { count: 'exact', head: true }).eq('status', 'recording');
  
  const { data: recentLogs } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);

  const { data: recentTargets } = await supabase
    .from('targets')
    .select('*')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Zap className="w-8 h-8 text-primary" />
          Live Command
        </h1>
        <p className="text-muted-foreground">Autonomous monitoring control plane & local worker status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fleet Size</CardTitle>
            <TargetIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targetsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Configured monitors</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Probes</CardTitle>
            <Radio className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTargets || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Polling for live</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Local Jobs</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRecordings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active worker tasks</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capture Library</CardTitle>
            <Video className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordingsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Stored sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-6">
           <Card className="border-border/50 bg-card/40">
            <CardHeader>
              <CardTitle>Autonomous Target Status</CardTitle>
              <CardDescription>Recently checked accounts in the monitoring fleet.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTargets && recentTargets.length > 0 ? (
                  (recentTargets as unknown as Target[]).map((target) => (
                    <div key={target.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border/50">
                          <TargetIcon className="w-5 h-5 text-accent opacity-50" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{target.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-mono">{target.provider} • {target.external_identifier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[10px]">Monitoring</Badge>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          Probe sync: {target.last_checked_at ? new Date(target.last_checked_at).toLocaleTimeString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground italic text-sm">
                    No active targets detected.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Worker Health</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                External workers poll for status every few seconds. Ensure your local environment has <code className="text-primary font-mono text-xs">yt-dlp</code> and <code className="text-primary font-mono text-xs">ffmpeg</code> installed for optimal performance.
              </p>
              <Link href="/admin/worker-guide" className="mt-4 inline-flex items-center text-xs font-bold text-primary hover:underline">
                View Operator Configuration Guide →
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3 border-border/50 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Latest engine & worker events.</CardDescription>
            </div>
            <Link href="/admin/logs">
              <History className="w-4 h-4 text-muted-foreground hover:text-accent transition-colors" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogs && recentLogs.length > 0 ? (
                (recentLogs as unknown as SystemLog[]).map((log) => (
                  <div key={log.id} className="flex gap-4 group">
                    <div className="mt-1">
                      {log.level === 'error' ? (
                        <ShieldCheck className="w-4 h-4 text-destructive" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-accent/20 flex items-center justify-center">
                           <div className="w-1 h-1 rounded-full bg-accent" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-medium leading-tight text-white/90">
                        {log.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm italic">
                  Waiting for events...
                </div>
              )}
              <Separator className="my-4 bg-border/40" />
              <Link 
                href="/admin/logs" 
                className="block w-full text-xs text-primary hover:text-primary/80 transition-colors font-medium text-center"
              >
                Full Audit Trail
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
