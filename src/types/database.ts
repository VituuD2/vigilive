export type TargetProvider = 'tiktok' | 'youtube' | 'twitch' | 'rtmp';
export type TargetStatus = 'active' | 'paused' | 'error';
export type RecordingStatus = 'processing' | 'recording' | 'completed' | 'failed';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type UserRole = 'admin' | 'operator' | 'viewer';
export type DiscoveryStatus = 'success' | 'failed' | 'offline';

export interface Target {
  id: string;
  name: string;
  provider: string;
  external_identifier: string;
  status: TargetStatus;
  monitor_enabled: boolean;
  check_interval_seconds: number;
  last_checked_at: string | null;
  last_live_at: string | null;
  last_discovery_status: DiscoveryStatus | null;
  last_discovery_error: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Recording {
  id: string;
  target_id: string;
  title: string | null;
  provider: string;
  external_stream_id: string | null;
  status: RecordingStatus;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  storage_path: string | null;
  thumbnail_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  error_message: string | null;
  locked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  targets?: {
    name: string;
    provider: string;
  } | null;
}

export interface SystemLog {
  id: string;
  level: LogLevel;
  message: string;
  context: Record<string, unknown>;
  target_id: string | null;
  recording_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface RecordingEvent {
  id: string;
  recording_id: string | null;
  target_id: string | null;
  event_type: string;
  message: string;
  context: Record<string, unknown>;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
