
# Vigilive Admin MVP

Professional cloud recording and monitoring administrative platform foundation. Built for scale, security, and operational clarity.

## 🚀 Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict)
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **AI**: Google Gemini (via Genkit)

## 📁 Project Structure
```text
src/
  ai/           # GenAI flows and configuration
  app/          # Routes (Auth and Protected Admin)
  components/   # Modular UI components
  core/         # Domain interfaces and business logic
  hooks/        # Custom React hooks
  lib/          # Infrastructure utilities (Supabase, etc.)
  types/        # Global TypeScript definitions
supabase/       # SQL migrations and schema definitions
```

## 🛠️ Setup Instructions

### 1. Supabase Setup
- Create a new project on [Supabase](https://supabase.com).
- Open the **SQL Editor** in your Supabase Dashboard.
- Run the contents of `supabase/migrations/20240101000000_initial_schema.sql` (if available) to create tables.
- **CRITICAL**: Run the contents of `supabase/migrations/20240101000001_fix_permissions.sql` to fix schema access and RLS policies.
- In **Authentication > Providers**, ensure Email/Password is enabled.
- In **Storage**, create three buckets: `recordings`, `thumbnails`, `exports`. Set them as private.

### 2. Environment Variables
- In Vercel or your local `.env.local`, set the following:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY`

### 3. Local Development
```bash
npm install
npm run dev -p 9002
```

### 4. Git Synchronization
To stage, commit, and push changes in a single command:
```bash
git add . && git commit -m "update permissions and readme" && git push
```

## 🔒 Troubleshooting: "Permission Denied for Schema Public"
If you see this error, it means the database user doesn't have the right to read the `public` schema.
1. Go to your Supabase Dashboard -> **SQL Editor**.
2. Create a "New Query".
3. Paste and run the code from `supabase/migrations/20240101000001_fix_permissions.sql`.
4. Refresh your application.

---
**Vigilive Operational Intelligence** | [Support](mailto:tech@vigilive.com)
