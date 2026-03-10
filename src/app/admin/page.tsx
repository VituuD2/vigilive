
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target as TargetIcon, Video, Activity, Zap, Clock, AlertCircle, Radio } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { count: targetsCount } = await supabase.from('targets').select('*', { count: 'exact', head: true });
  const { data: liveTargets } = await supabase.from('targets').select('*').eq('is_live', true);
  const { count: recordingsCount } = await supabase.from('recordings').select('*', { count: 'exact', head: true });
  const { count: activeRecordings } = await supabase.from('recordings').select('*', { count: 'exact', head: true }).eq('status', 'recording');
  
  const { data: recentLogs } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Zap className="w-8 h-8 text-primary" />
          Live Command
        </h1>
        <p className="text-muted-foreground">Autonomous monitoring and cloud recording status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Monitors</CardTitle>
            <TargetIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targetsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Sourcing streams</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Live Now</CardTitle>
            <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveTargets?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all platforms</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRecordings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Cloud workers busy</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Archive Size</CardTitle>
            <Video className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordingsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Captured sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-6">
           <Card className="border-border/50 bg-card/40">
            <CardHeader>
              <CardTitle>Currently Live</CardTitle>
              <CardDescription>Targets with detected active manifests.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveTargets && liveTargets.length > 0 ? (
                  liveTargets.map((target) => (
                    <div key={target.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                             {target.avatar_url && <img src={target.avatar_url} alt={target.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111213]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{target.display_name || target.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-mono">{target.provider} • {target.external_identifier}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">RECORDING</Badge>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground italic text-sm">
                    No active streams detected at this moment.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3 border-border/50 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Engine event log.</CardDescription>
            </div>
            <Link href="/admin/logs">
              <Clock className="w-4 h-4 text-muted-foreground hover:text-accent transition-colors" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogs && recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 group">
                    <div className="mt-1">
                      {log.level === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-destructive" />
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
