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
      <Button variant="destructive" size="icon" className="h-7 w-7" title="Stop Local Process">
        <Square className="h-3 w-3" />
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
      <Button variant="outline" size="icon" className="h-7 w-7 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10" title="Force Cleanup">
        <RefreshCcw className="h-3 w-3" />
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
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-primary" />
            Capture Library
          </h1>
          <p className="text-muted-foreground">Archive of sessions captured by autonomous local workers.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {typedRecordings.length > 0 ? (
          typedRecordings.map((rec) => (
            <Card key={rec.id} className="group border-border/50 bg-card/40 overflow-hidden hover:border-accent/50 transition-all flex flex-col">
              <div className="relative aspect-video bg-muted overflow-hidden">
                <Image 
                  src={rec.thumbnail_path || `https://picsum.photos/seed/${rec.id}/640/360`}
                  alt="Capture Preview"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-100"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant="outline" className={`${getStatusStyles(rec.status)} backdrop-blur-md text-[9px] uppercase font-bold py-0 h-5`}>
                    {(rec.status === 'recording' || rec.status === 'processing') && <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />}
                    {rec.status === 'recording' ? 'Live' : rec.status}
                  </Badge>
                </div>
                {rec.duration_seconds && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white backdrop-blur-sm">
                    {Math.floor(rec.duration_seconds / 60)}m {rec.duration_seconds % 60}s
                  </div>
                )}
                {rec.status === 'completed' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                    <Link href={`/admin/recordings/${rec.id}`}>
                      <PlayCircle className="w-12 h-12 text-primary shadow-2xl" />
                    </Link>
                  </div>
                )}
              </div>
              <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1 mb-3">
                  <h3 className="font-semibold truncate text-sm text-white leading-none">
                    {rec.title || `Session ${rec.id.split('-')[0]}`}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground truncate">
                      {rec.targets?.name || 'Manual Ingest'}
                    </p>
                    <span className="text-accent uppercase font-mono text-[9px] font-bold tracking-tighter">
                      {rec.targets?.provider || rec.provider}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-accent/60" />
                    {new Date(rec.started_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-accent/60" />
                    {new Date(rec.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="secondary" size="sm" className="flex-1 text-[10px] h-7 font-bold uppercase tracking-wider">
                    <Link href={`/admin/recordings/${rec.id}`}>
                      {rec.status === 'completed' ? 'Watch' : 'Review'}
                    </Link>
                  </Button>
                  
                  <div className="flex gap-1.5">
                    {(rec.status === 'recording' || rec.status === 'processing') && (
                      <StopButton id={rec.id} />
                    )}
                    
                    {(rec.status === 'processing' || rec.status === 'recording') && (
                      <CleanupButton id={rec.id} />
                    )}

                    {rec.storage_path && rec.status === 'completed' && (
                      <Button variant="outline" size="icon" className="h-7 w-7 border-border/60" asChild>
                        <a href={`/admin/recordings/${rec.id}`}>
                          <Download className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground space-y-4 border-2 border-dashed border-border/30 rounded-2xl">
            <Video className="w-12 h-12 opacity-10" />
            <div className="text-center">
              <p className="font-medium">Capture library is empty</p>
              <p className="text-xs">Once the local worker detects live streams, recordings will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
