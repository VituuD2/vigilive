import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Download, 
  ChevronLeft, 
  Target as TargetIcon, 
  HardDrive,
  FileVideo,
  Info,
  Database
} from 'lucide-react';
import Link from 'next/link';
import { Recording } from '@/types/database';
import { getSignedUrlForRecording } from '@/lib/actions/recordings';
import { RecordingPlayer } from '@/components/admin/recording-player';
import { Separator } from '@/components/ui/separator';

export default async function RecordingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recording, error } = await supabase
    .from('recordings')
    .select('*, targets(name, provider)')
    .eq('id', id)
    .maybeSingle();

  if (error || !recording) {
    notFound();
  }

  const rec = recording as unknown as Recording;
  
  let signedUrl: string | null = null;
  try {
    if (rec.storage_path) {
      signedUrl = await getSignedUrlForRecording(rec.id);
    }
  } catch (e) {
    console.error('Signed URL generation failed:', e);
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white transition-colors">
          <Link href="/admin/recordings" className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Library
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 bg-card/20 p-6 rounded-2xl border border-border/40 backdrop-blur-sm">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {rec.title || `Session ${rec.id.split('-')[0]}`}
            </h1>
            <Badge className={`${
              rec.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
              rec.status === 'recording' ? 'bg-primary/10 text-primary border-primary/20 animate-pulse' : 
              rec.status === 'processing' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'
            } backdrop-blur-md capitalize text-[10px] font-bold px-3`}>
              {rec.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <TargetIcon className="w-4 h-4 text-accent" />
            Source: <span className="text-white font-medium">{rec.targets?.name || 'Manual Ingest'}</span> • 
            <span className="uppercase font-mono text-xs text-accent">{rec.targets?.provider || rec.provider}</span>
          </p>
        </div>

        <div className="flex gap-2">
          {signedUrl && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <a href={signedUrl} download={`${rec.title || rec.id}.mp4`}>
                <Download className="w-4 h-4 mr-2" />
                Download Raw
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <RecordingPlayer 
            signedUrl={signedUrl} 
            thumbnailPath={rec.thumbnail_path} 
            status={rec.status} 
          />

          <Card className="border-border/50 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                Session Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Storage Identifier</p>
                  <p className="text-xs text-white font-mono bg-muted/30 p-2 rounded truncate">{rec.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">File Metadata</p>
                  <p className="text-xs text-white">
                    {rec.mime_type || 'video/mp4'} • {formatSize(rec.file_size_bytes)}
                  </p>
                </div>
              </div>
              
              {rec.error_message && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 mt-4">
                  <p className="text-[10px] uppercase text-destructive font-bold mb-1">Termination Report</p>
                  <p className="text-xs text-destructive/90">{rec.error_message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Metadata */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Temporal Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Captured On</p>
                  <p className="text-sm text-white">{new Date(rec.started_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Total Duration</p>
                  <p className="text-sm text-white">
                    {rec.duration_seconds 
                      ? `${Math.floor(rec.duration_seconds / 60)}m ${rec.duration_seconds % 60}s` 
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <Separator className="bg-border/40" />
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Internal Timestamp</p>
                <p className="text-[10px] font-mono text-muted-foreground/60">{new Date(rec.started_at).toISOString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Infrastructure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Database className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Bucket Node</p>
                  <p className="text-xs text-white truncate font-mono">
                    {rec.storage_path || 'Writing to disk...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Provider API</p>
                  <p className="text-xs text-white capitalize">{rec.targets?.provider || rec.provider} Protocol</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
