'use client';

import { useState } from 'react';
import { Play, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecordingPlayerProps {
  signedUrl: string | null;
  thumbnailPath?: string | null;
  status: string;
}

export function RecordingPlayer({ signedUrl, thumbnailPath, status }: RecordingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedUrl) {
    return (
      <div className="relative aspect-video bg-black/40 flex flex-col items-center justify-center text-center p-6 space-y-4 rounded-xl border border-border/50">
        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground opacity-50" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">Playback Unavailable</p>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            {status === 'recording' || status === 'processing' 
              ? 'This session is currently active. Playback will be available once the worker finalizes the file.'
              : 'The recording file could not be located in secure storage.'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative aspect-video bg-destructive/5 flex flex-col items-center justify-center text-center p-6 space-y-2 rounded-xl border border-destructive/20">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">Failed to load video</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-border/50 group shadow-2xl">
      {!isPlaying ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {thumbnailPath && (
            <img 
              src={thumbnailPath} 
              alt="Preview" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px]" 
            />
          )}
          <button 
            onClick={() => setIsPlaying(true)}
            className="w-20 h-20 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 z-20"
          >
            <Play className="w-10 h-10 fill-current" />
          </button>
        </div>
      ) : (
        <video 
          src={signedUrl} 
          controls 
          autoPlay 
          className="w-full h-full"
          onError={() => setError('The video file format may be unsupported or the access link expired.')}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
