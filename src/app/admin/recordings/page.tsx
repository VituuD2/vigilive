import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, Download, AlertTriangle, Loader2, Square, RefreshCcw, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Recording } from '@/types/database';
import { stopActiveRecording, cleanupStaleRecording } from '@/lib/actions/recordings';

async function StopButton({ id }: { id: string }) {
  "use server"
  return (
    <form action={async () => {
      "use server"
      await stopActiveRecording(id);
    }}>
      <Button variant="destructive" size="icon" className="h-6 w-6" title="Stop Local Process">
        <Square className="h-2.5 w-2.5" />
      </Button>
    </form>
  )
}

async function CleanupButton({ id }: { id: string }) {
  "use server"
  return (
    <form action={async () => {
      "use server"
      await cleanupStaleRecording(id);
    }}>
      <Button variant="outline" size="icon" className="h-6 w-6 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10" title="Force Cleanup">
        <RefreshCcw className="h-2.5 w-2.5" />
      </Button>
    </form>
  )
}

export default async function RecordingsPage() {
  const supabase = await createClient();
  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('*, targets(name, provider)')
    .order('started_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 border-2 border-dashed border-destructive/20 rounded-2xl bg-destructive/5 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
        <h3 className="font-bold">Library synchronization error</h3>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const typedRecordings = (recordings as unknown as Recording[]) || [];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'recording': return 'bg-primary/10 text-primary border-primary/20 animate-pulse';
      case 'processing': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            Capture Library
          </h1>
          <p className="text-xs text-muted-foreground">Archive of sessions captured by autonomous local workers.</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {typedRecordings.length > 0 ? (
          typedRecordings.map((rec) => (
            <Card key={rec.id} className="group border-border/50 bg-card/40 overflow-hidden hover:border-accent/40 transition-all flex flex-col">
              <div className="relative aspect-video bg-muted overflow-hidden">
                <Image 
                  src={rec.thumbnail_path || `https://picsum.photos/seed/${rec.id}/400/225`}
                  alt="Capture Preview"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-50 group-hover:opacity-100"
                />
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <Badge variant="outline" className={`${getStatusStyles(rec.status)} backdrop-blur-md text-[8px] uppercase font-bold py-0 h-4 px-1.5`}>
                    {(rec.status === 'recording' || rec.status === 'processing') && <Loader2 className="w-2 h-2 mr-1 animate-spin" />}
                    {rec.status === 'recording' ? 'Live' : rec.status}
                  </Badge>
                </div>
                {rec.duration_seconds && (
                  <div className="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded bg-black/80 text-[8px] font-bold text-white backdrop-blur-sm">
                    {Math.floor(rec.duration_seconds / 60)}m {rec.duration_seconds % 60}s
                  </div>
                )}
                {rec.status === 'completed' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-[1px]">
                    <Link href={`/admin/recordings/${rec.id}`}>
                      <PlayCircle className="w-8 h-8 text-primary shadow-2xl" />
                    </Link>
                  </div>
                )}
              </div>
              <CardContent className="p-3 flex-1 flex flex-col justify-between">
                <div className="space-y-0.5 mb-2">
                  <h3 className="font-medium truncate text-xs text-white leading-none">
                    {rec.title || `Session ${rec.id.split('-')[0]}`}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-muted-foreground truncate">
                      {rec.targets?.name || 'Manual Ingest'}
                    </p>
                    <span className="text-accent uppercase font-mono text-[8px] font-bold">
                      {rec.targets?.provider || rec.provider}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-[8px] text-muted-foreground mb-3 opacity-70">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-2 h-2" />
                    {new Date(rec.started_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-2 h-2" />
                    {new Date(rec.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <Button asChild variant="secondary" size="sm" className="flex-1 text-[9px] h-6 font-bold uppercase tracking-wider">
                    <Link href={`/admin/recordings/${rec.id}`}>
                      {rec.status === 'completed' ? 'Watch' : 'Review'}
                    </Link>
                  </Button>
                  
                  <div className="flex gap-1">
                    {(rec.status === 'recording' || rec.status === 'processing') && (
                      <StopButton id={rec.id} />
                    )}
                    
                    {(rec.status === 'processing' || rec.status === 'recording') && (
                      <CleanupButton id={rec.id} />
                    )}

                    {rec.storage_path && rec.status === 'completed' && (
                      <Button variant="outline" size="icon" className="h-6 w-6 border-border/60" asChild>
                        <a href={`/admin/recordings/${rec.id}`}>
                          <Download className="h-2.5 w-2.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-muted-foreground space-y-3 border border-dashed border-border/30 rounded-xl">
            <Video className="w-10 h-10 opacity-10" />
            <div className="text-center">
              <p className="text-sm font-medium">Capture library is empty</p>
              <p className="text-[10px]">Active recordings will appear here automatically.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
