
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, Video, Activity, Zap, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { count: targetsCount } = await supabase.from('targets').select('*', { count: 'exact', head: true });
  const { count: liveCount } = await supabase.from('targets').select('*', { count: 'exact', head: true }).eq('is_live', true);
  const { count: recordingsCount } = await supabase.from('recordings').select('*', { count: 'exact', head: true });
  const { count: activeRecordings } = await supabase.from('recordings').select('*', { count: 'exact', head: true }).eq('status', 'recording');
  
  const { data: recentLogs } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const stats = [
    { title: 'Total Targets', value: targetsCount || 0, sub: `${liveCount || 0} currently live`, icon: Target, color: 'text-primary' },
    { title: 'Library Size', value: recordingsCount || 0, sub: 'Archived captures', icon: Video, color: 'text-accent' },
    { title: 'Active Jobs', value: activeRecordings || 0, sub: 'Workers busy', icon: Activity, color: 'text-emerald-500' },
    { title: 'Engine Health', value: 'Nominal', sub: 'Status: Healthy', icon: Zap, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Operational Dashboard</h1>
        <p className="text-muted-foreground">Monitoring and recording infrastructure status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border/50 bg-card/40">
          <CardHeader>
            <CardTitle>Stream Matrix</CardTitle>
            <CardDescription>Live telemetry for monitored sources.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground italic">
            <div className="text-center space-y-2">
              <Activity className="w-12 h-12 mx-auto text-primary opacity-20" />
              <p>Polling for live stream events...</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/50 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest engine events.</CardDescription>
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
                      ) : log.level === 'warn' ? (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-medium leading-none group-hover:text-accent transition-colors">
                        {log.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm italic">
                  No recent operational events.
                </div>
              )}
              <Separator className="my-4 bg-border/40" />
              <Link 
                href="/admin/logs" 
                className="block w-full text-xs text-primary hover:text-primary/80 transition-colors font-medium text-center"
              >
                View Full Audit Trail
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
