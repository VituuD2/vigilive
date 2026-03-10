
export type TargetStatus = 'active' | 'paused' | 'error' | 'idle' | 'pending_auth';
export type RecordingStatus = 'recording' | 'completed' | 'failed';

export interface Target {
  id: string;
  created_at: string;
  name: string;
  provider: 'youtube' | 'twitch' | 'rtmp' | 'tiktok';
  external_identifier: string; // The username or channel ID
  platform_user_id?: string;    // Unique ID from the provider
  display_name?: string;       // Friendly name from the provider
  avatar_url?: string;         // Profile picture URL
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
  targets?: {
    name: string;
    avatar_url?: string;
    display_name?: string;
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
