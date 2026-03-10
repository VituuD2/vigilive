
-- 1. Grant usage on the public schema to Supabase standard roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant access to all tables and sequences in the public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Ensure default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS) and create basic policies for Admin access
-- Note: Replace 'authenticated' with specific role logic if you have complex permissions.

-- Targets Table
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access" ON targets;
CREATE POLICY "Admin full access" ON targets FOR ALL TO authenticated USING (true);

-- Recordings Table
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access" ON recordings;
CREATE POLICY "Admin full access" ON recordings FOR ALL TO authenticated USING (true);

-- System Logs Table
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access" ON system_logs;
CREATE POLICY "Admin full access" ON system_logs FOR ALL TO authenticated USING (true);

-- Profiles Table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access" ON profiles;
CREATE POLICY "Admin full access" ON profiles FOR ALL TO authenticated USING (true);
