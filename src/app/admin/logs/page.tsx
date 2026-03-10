
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
          <h1 className="text-3xl font-bold tracking-tight text-white">System Diagnostics</h1>
          <p className="text-muted-foreground">Deep dive into operational events and engine activity.</p>
        </div>
        
        <LogSummarizer 
          systemLogs={systemLogs || []} 
          recordingEvents={recordingEvents || []} 
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[100px]">Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Target/Rec</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemLogs && systemLogs.length > 0 ? (
              systemLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell>
                    <Badge className={
                      log.level === 'error' ? 'bg-destructive/20 text-destructive border-destructive/50' :
                      log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' :
                      'bg-accent/20 text-accent border-accent/50'
                    }>
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate font-medium text-sm">
                    {log.message}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground uppercase font-mono">
                    {log.target_id?.split('-')[0] || 'SYSTEM'}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                  No logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
