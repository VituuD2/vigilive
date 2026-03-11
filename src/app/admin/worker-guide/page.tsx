import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Terminal, Code, Settings, ShieldAlert, Cpu } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function WorkerGuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Terminal className="w-8 h-8 text-primary" />
          Worker Integration Guide
        </h1>
        <p className="text-muted-foreground">Operational manual for external recording nodes.</p>
      </div>

      <Card className="border-border/50 bg-card/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            <CardTitle>Architecture Overview</CardTitle>
          </div>
          <CardDescription>How the control plane communicates with your local recording script.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The Vigilive Admin panel acts as the <strong>Control Plane</strong>. It manages target configuration and provides a library for finished captures. 
            The <strong>Data Plane</strong> consists of external workers (scripts) that run locally on high-bandwidth machines.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Control Plane (Web)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Target Management</li>
                <li>Discovery Health Monitoring</li>
                <li>Storage & Playback Library</li>
                <li>Stop/Cleanup Signal Injection</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Data Plane (Worker)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Target Probing (yt-dlp)</li>
                <li>Stream Recording (ffmpeg)</li>
                <li>File Upload (Supabase Storage)</li>
                <li>Status Synchronization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="border-border/50 bg-card/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              API Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">1. Discovery Loop</h4>
              <p className="text-xs text-muted-foreground">Your worker should poll <code className="text-accent">GET /api/worker/targets</code> to find accounts marked for monitoring. For each target, run a probe and update health via <code className="text-accent">PATCH /api/worker/targets/[id]</code>.</p>
            </section>
            
            <Separator className="bg-border/40" />
            
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">2. Active Capture</h4>
              <p className="text-xs text-muted-foreground">When live is detected, call <code className="text-accent">POST /api/worker/recordings</code> to get a job ID. During recording, you MUST poll <code className="text-accent">GET /api/worker/recordings/[id]</code>. If the status changes to <code className="text-destructive font-bold">completed</code>, immediately send SIGINT to your recording process.</p>
            </section>
            
            <Separator className="bg-border/40" />

            <section className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">3. Finalization</h4>
              <p className="text-xs text-muted-foreground">Once finished, upload the file to Supabase Storage and call <code className="text-accent">PATCH /api/worker/recordings/[id]</code> with the final <code className="text-accent">storage_path</code> and <code className="text-accent">duration_seconds</code>.</p>
            </section>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-destructive/5 border-destructive/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              <CardTitle>Environment Variables</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-xs">
            <p>Your worker needs the following secrets from your .env:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><span className="text-white">NEXT_PUBLIC_SUPABASE_URL</span>: Your project URL</li>
              <li><span className="text-white">SUPABASE_SERVICE_ROLE_KEY</span>: Required for writing to logs and storage</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Need a reference implementation?</p>
          <p className="text-xs text-muted-foreground">The API is designed to be compatible with standard Node.js or Python scripts.</p>
        </div>
        <Settings className="w-6 h-6 text-accent opacity-50" />
      </div>
    </div>
  );
}
