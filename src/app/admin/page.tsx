
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Target, Video, AlertCircle, Activity, Play, CheckCircle2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Real data fetching
  const { count: targetsCount } = await supabase.from('targets').select('*', { count: 'exact', head: true })
  const { count: activeTargets } = await supabase.from('targets').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { count: recordingsCount } = await supabase.from('recordings').select('*', { count: 'exact', head: true })
  const { count: activeRecordings } = await supabase.from('recordings').select('*', { count: 'exact', head: true }).eq('status', 'recording')
  
  // Recent activity
  const { data: recentLogs } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { title: 'Total Targets', value: targetsCount || 0, sub: `${activeTargets || 0} active now`, icon: Target, color: 'text-primary' },
    { title: 'Total Recordings', value: recordingsCount || 0, sub: `${activeRecordings || 0} in progress`, icon: Video, color: 'text-accent' },
    { title: 'System Uptime', value: '99.9%', sub: 'Last 30 days', icon: Activity, color: 'text-emerald-500' },
    { title: 'Alerts', value: 0, sub: 'No critical issues', icon: AlertCircle, color: 'text-muted-foreground' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time status of your monitoring and recording infrastructure.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-current opacity-20 ${stat.color}`} />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border/50 bg-card/40">
          <CardHeader>
            <CardTitle>Platform Status</CardTitle>
            <CardDescription>Engine performance and resource utilization.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground italic border-t border-border/20 mt-2">
            <div className="text-center space-y-2">
              <Zap className="w-12 h-12 mx-auto text-accent opacity-20" />
              <p>Performance telemetry data arriving...</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/50 bg-card/40">
          <CardHeader>
            <CardTitle>Recent System Logs</CardTitle>
            <CardDescription>Latest operational events captured.</CardDescription>
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
                  No recent logs found.
                </div>
              )}
              <Separator className="my-4 bg-border/40" />
              <button className="w-full text-xs text-primary hover:text-primary/80 transition-colors font-medium text-center">
                View all system logs
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
