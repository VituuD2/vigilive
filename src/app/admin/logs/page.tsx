import { createClient } from '@/lib/supabase/server'
import { LogSummarizer } from '@/components/admin/log-summarizer'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { History, ShieldAlert, Info, AlertTriangle, Bug } from 'lucide-react'
import { SystemLog, RecordingEvent } from '@/types/database'

export default async function LogsPage() {
  const supabase = await createClient()
  
  const { data: systemLogs } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: recordingEvents } = await supabase
    .from('recording_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Audit Trail
          </h1>
          <p className="text-muted-foreground">Comprehensive log of engine activity and platform security events.</p>
        </div>
        
        <LogSummarizer 
          systemLogs={(systemLogs as unknown as SystemLog[]) || []} 
          recordingEvents={(recordingEvents as unknown as RecordingEvent[]) || []} 
        />
      </div>

      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle>Operational History</CardTitle>
          <CardDescription>The last 50 system events across all targets.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px]">Level</TableHead>
                <TableHead>Event Details</TableHead>
                <TableHead className="w-[150px]">Context</TableHead>
                <TableHead className="text-right w-[180px]">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemLogs && systemLogs.length > 0 ? (
                (systemLogs as unknown as SystemLog[]).map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.level === 'error' ? (
                          <ShieldAlert className="w-3 h-3 text-destructive" />
                        ) : log.level === 'warn' ? (
                          <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        ) : log.level === 'debug' ? (
                          <Bug className="w-3 h-3 text-blue-500" />
                        ) : (
                          <Info className="w-3 h-3 text-accent" />
                        )}
                        <Badge variant="outline" className={
                          log.level === 'error' ? 'text-destructive border-destructive/30' :
                          log.level === 'warn' ? 'text-yellow-500 border-yellow-500/30' :
                          log.level === 'debug' ? 'text-blue-500 border-blue-500/30' :
                          'text-accent border-accent/30'
                        }>
                          {log.level}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {log.message}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground uppercase font-mono">
                      {log.target_id ? `TRGT-${log.target_id.split('-')[0]}` : 'SYSTEM'}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                    No system logs recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
