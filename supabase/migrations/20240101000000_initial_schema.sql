
-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'viewer');
CREATE TYPE target_status AS ENUM ('active', 'paused', 'error');
CREATE TYPE recording_status AS ENUM ('recording', 'completed', 'failed', 'processing');
CREATE TYPE log_level AS ENUM ('info', 'warn', 'error', 'debug');

-- TABLES

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'viewer' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Targets (monitoring endpoints)
CREATE TABLE public.targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- e.g., 'youtube', 'twitch', 'rtmp'
  external_identifier TEXT NOT NULL,
  status target_status DEFAULT 'paused' NOT NULL,
  monitor_enabled BOOLEAN DEFAULT false NOT NULL,
  check_interval_seconds INTEGER DEFAULT 60 NOT NULL,
  last_checked_at TIMESTAMPTZ,
  last_live_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,
  UNIQUE(provider, external_identifier)
);

-- Recordings
CREATE TABLE public.recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id UUID REFERENCES public.targets(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  provider TEXT NOT NULL,
  external_stream_id TEXT,
  status recording_status DEFAULT 'processing' NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  storage_path TEXT,
  thumbnail_path TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Recording Events (milestones during recording)
CREATE TABLE public.recording_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID REFERENCES public.recordings(id) ON DELETE CASCADE,
  target_id UUID REFERENCES public.targets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g., 'START', 'STOP', 'SEGMENT_WRITTEN'
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- System Logs (Operational logs)
CREATE TABLE public.system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level log_level DEFAULT 'info' NOT NULL,
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb NOT NULL,
  target_id UUID REFERENCES public.targets(id) ON DELETE SET NULL,
  recording_id UUID REFERENCES public.recordings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Audit Logs (Administrative actions)
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- e.g., 'TARGET_CREATED', 'RECORDING_DELETED'
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- App Settings
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Provider Configs
CREATE TABLE public.provider_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  config JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recording_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;

-- Simple policy for MVP: Authenticated users can read/write if they are active profiles
CREATE POLICY "Authenticated users can read all data" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all targets" ON public.targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all recordings" ON public.recordings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all events" ON public.recording_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all logs" ON public.system_logs FOR SELECT TO authenticated USING (true);

-- Functions for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_targets_updated_at BEFORE UPDATE ON public.targets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON public.recordings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_provider_configs_updated_at BEFORE UPDATE ON public.provider_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
