
export type TargetProvider = 'tiktok' | 'youtube' | 'twitch' | 'custom';
export type MonitoringStatus = 'active' | 'paused';
export type RecordingStatus = 'pending' | 'recording' | 'finalizing' | 'completed' | 'failed';

export interface Target {
  id: string;
  created_at: string;
  name: string;
  provider: TargetProvider;
  external_identifier: string;
  room_id: string | null;
  monitoring_status: MonitoringStatus;
  is_live: boolean;
  last_checked_at: string | null;
  avatar_url?: string;
  display_name?: string;
  metadata?: Record<string, any>;
}

export interface Recording {
  id: string;
  target_id: string;
  status: RecordingStatus;
  stream_url: string | null;
  recording_path: string | null;
  thumbnail_path: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  error_message?: string;
  locked_at: string | null;
  targets?: {
    name: string;
    provider: TargetProvider;
    avatar_url?: string;
  };
}

export interface SystemLog {
  id: string;
  created_at: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  target_id: string | null;
  recording_id: string | null;
  payload?: any;
}
