
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { summarizeLogs, LogSummarizationOutput } from '@/ai/flows/ai-log-summarization'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LogSummarizerProps {
  systemLogs: any[]
  recordingEvents: any[]
}

export function LogSummarizer({ systemLogs, recordingEvents }: LogSummarizerProps) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<LogSummarizationOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSummarize = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await summarizeLogs({
        systemLogs: systemLogs.map(l => ({
          id: l.id,
          level: l.level,
          message: l.message,
          created_at: l.created_at,
          context: l.context
        })),
        recordingEvents: recordingEvents.map(e => ({
          id: e.id,
          event_type: e.event_type,
          message: e.message,
          created_at: e.created_at,
          context: e.context
        }))
      })
      setSummary(result)
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-accent/50 hover:bg-accent/10">
          <Sparkles className="w-4 h-4 text-accent" />
          AI Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Intelligent Log Analysis
          </DialogTitle>
          <DialogDescription>
            AI-powered summarization of your latest system events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {!summary && !loading && !error && (
            <div className="text-center py-10 space-y-4">
              <p className="text-muted-foreground text-sm">
                Ready to analyze {systemLogs.length} logs and {recordingEvents.length} events.
              </p>
              <Button onClick={handleSummarize} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Generate Insights
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Consulting operational patterns...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {summary && (
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-6">
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-accent uppercase tracking-wider">Executive Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {summary.summary}
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Key Events</h4>
                  <ul className="space-y-2">
                    {summary.keyEvents.map((event, i) => (
                      <li key={i} className="text-sm flex gap-2 items-start">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-destructive uppercase tracking-wider">Potential Issues</h4>
                  {summary.potentialIssues.length > 0 ? (
                    <ul className="space-y-2">
                      {summary.potentialIssues.map((issue, i) => (
                        <li key={i} className="text-sm flex gap-2 items-start">
                          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">No critical anomalies detected.</p>
                  )}
                </section>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
