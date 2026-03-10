
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, Download, ExternalLink, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Recording } from '@/types/database';

export default async function RecordingsPage() {
  const supabase = await createClient();
  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('*, targets(name)')
    .order('started_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 border-2 border-dashed border-destructive/20 rounded-2xl bg-destructive/5 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
        <h3 className="font-bold">Library unavailable</h3>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const typedRecordings = (recordings as Recording[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Recordings Library</h1>
        <p className="text-muted-foreground">Access and manage all captured stream content.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {typedRecordings.length > 0 ? (
          typedRecordings.map((rec) => (
            <Card key={rec.id} className="group border-border/50 bg-card/40 overflow-hidden hover:border-accent/50 transition-all">
              <div className="relative aspect-video bg-muted overflow-hidden">
                <Image 
                  src={rec.thumbnail_path || `https://picsum.photos/seed/${rec.id}/640/360`}
                  alt={rec.title || 'Recording thumbnail'}
                  fill
                  data-ai-hint="video stream"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <Badge className={`${
                    rec.status === 'completed' ? 'bg-emerald-500/80' : 
                    rec.status === 'recording' ? 'bg-primary/80 animate-pulse' : 'bg-destructive/80'
                  } backdrop-blur-md border-0 shadow-lg`}>
                    {rec.status}
                  </Badge>
                </div>
                {rec.duration_seconds && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-[10px] font-bold text-white backdrop-blur-sm">
                    {Math.floor(rec.duration_seconds / 60)}m {rec.duration_seconds % 60}s
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold truncate text-white leading-none">
                    {rec.title || `Recording ${rec.id.split('-')[0]}`}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    Target: {rec.targets?.name || 'Deleted Target'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-accent" />
                    {new Date(rec.started_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-accent" />
                    {new Date(rec.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8 border-border/60 hover:border-accent/50">
                    <Link href={`/admin/recordings/${rec.id}`}>
                      View Details
                    </Link>
                  </Button>
                  {rec.recording_path && (
                    <Button variant="secondary" size="icon" className="h-8 w-8" title="Download">
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground space-y-4 border-2 border-dashed border-border/30 rounded-2xl">
            <Video className="w-12 h-12 opacity-10" />
            <div className="text-center">
              <p className="font-medium">No recordings in the library</p>
              <p className="text-xs">Once targets are active, recordings will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
