
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Download, 
  ChevronLeft, 
  Target, 
  HardDrive,
  FileVideo,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Recording } from '@/types/database';

export default async function RecordingDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recording, error } = await supabase
    .from('recordings')
    .select('*, targets(*)')
    .eq('id', id)
    .single();

  if (error || !recording) {
    notFound();
  }

  const rec = recording as Recording;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="h-8">
          <Link href="/admin/recordings" className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Library
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {rec.title || `Recording ${rec.id.split('-')[0]}`}
            </h1>
            <Badge className={`${
              rec.status === 'completed' ? 'bg-emerald-500/80' : 
              rec.status === 'recording' ? 'bg-primary/80 animate-pulse' : 'bg-destructive/80'
            } backdrop-blur-md`}>
              {rec.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">Detailed capture analysis and resource properties.</p>
        </div>

        <div className="flex gap-2">
          {rec.recording_path && (
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Download className="w-4 h-4 mr-2" />
              Download MP4
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Media Preview */}
        <Card className="lg:col-span-2 border-border/50 bg-card/40 overflow-hidden">
          <div className="relative aspect-video bg-black flex items-center justify-center">
            {rec.recording_path ? (
              <div className="text-center space-y-4">
                <FileVideo className="w-16 h-16 mx-auto text-accent opacity-20" />
                <p className="text-sm text-muted-foreground">Video player integration required for .mp4 streams</p>
              </div>
            ) : (
              <Image 
                src={rec.thumbnail_path || `https://picsum.photos/seed/${rec.id}/1280/720`}
                alt="Capture Preview"
                fill
                className="object-cover opacity-50 blur-[2px]"
                data-ai-hint="video stream"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="bg-background/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-border/50 flex items-center gap-3">
                 <AlertTriangle className="w-5 h-5 text-yellow-500" />
                 <span className="text-sm font-medium">Capture source verification required for playback</span>
               </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Stream Source</h4>
                <p className="text-xs text-muted-foreground font-mono">{rec.targets?.name || 'Unknown'}</p>
              </div>
              <div className="text-right space-y-1">
                <h4 className="text-sm font-semibold text-white">Identifier</h4>
                <p className="text-xs text-muted-foreground font-mono">{rec.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg">Temporal Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Start Date</p>
                  <p className="text-sm text-white">{new Date(rec.started_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Duration</p>
                  <p className="text-sm text-white">
                    {rec.duration_seconds ? `${Math.floor(rec.duration_seconds / 60)}m ${rec.duration_seconds % 60}s` : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg">Storage Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Storage Bucket</p>
                  <p className="text-sm text-white font-mono truncate max-w-[150px]">
                    {rec.recording_path?.split('/')[0] || 'recordings-default'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Target className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Provider Ref</p>
                  <p className="text-sm text-white capitalize">{rec.targets?.provider || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
