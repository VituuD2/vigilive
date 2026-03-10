
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
- Open the **SQL Editor** and run the contents of `supabase/migrations/20240101000000_initial_schema.sql`.
- In **Authentication > Providers**, ensure Email/Password is enabled.
- In **Storage**, create three buckets: `recordings`, `thumbnails`, `exports`. Set them as private.

### 2. Environment Variables
- Copy `.env.example` to `.env.local`.
- Fill in your Supabase URL, Anon Key, Service Role Key (Server only), and Gemini API Key.

### 3. Local Development
```bash
npm install
npm run dev -p 9002
```

### 4. Git Synchronization
To stage, commit, and push changes in a single command:
```bash
git add . && git commit -m "your description" && git push
```

### 5. Deployment (Vercel)
- Push code to GitHub.
- Connect your repo to Vercel.
- Add the environment variables from `.env.local` to the Vercel project settings.
- Deploy.

## 🔒 Security Measures
- **Supabase Auth**: JWT-based session management.
- **Middleware Protection**: All `/admin` routes are server-side protected.
- **Row Level Security (RLS)**: Data access restricted at the database level.

## 🤖 GenAI Features
The "AI Analysis" tool in the Diagnostics page uses Gemini to summarize complex log sequences, highlighting key events and identifying potential anomalies for operators.

---
**Vigilive Operational Intelligence** | [Support](mailto:tech@vigilive.com)
