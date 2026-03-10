
export type TargetStatus = 'active' | 'paused' | 'error' | 'idle' | 'pending_auth';
export type RecordingStatus = 'recording' | 'completed' | 'failed' | 'finalizing';

export interface Target {
  id: string;
  created_at: string;
  name: string;
  provider: 'youtube' | 'twitch' | 'rtmp' | 'tiktok';
  external_identifier: string; // The username, channel ID, or RTMP URL
  platform_user_id?: string;    
  display_name?: string;       
  avatar_url?: string;         
  status: TargetStatus;
  last_checked_at: string | null;
  metadata?: Record<string, any>;
}

export interface Recording {
  id: string;
  target_id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: RecordingStatus;
  thumbnail_path: string | null;
  recording_path: string | null;
  error_message?: string;
  targets?: {
    name: string;
    avatar_url?: string;
    display_name?: string;
    provider: string;
  };
}

export interface SystemLog {
  id: string;
  created_at: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  target_id: string | null;
  recording_id: string | null;
  context?: any;
}

export interface RecordingEvent {
  id: string;
  recording_id: string;
  event_type: 'start' | 'stop' | 'error' | 'live_detected' | 'storage_finalized';
  message: string;
  created_at: string;
  context?: any;
}
