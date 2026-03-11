# Vigilive Admin: Operational Control Center

Autonomous stream archiving and cloud recording platform. Monitors authorized live sources (TikTok, YouTube, Twitch) via external workers and manages a distributed recording pipeline.

## 🚀 Core Architecture

- **Web Control Plane (Next.js/Supabase)**: Manages targets, monitors status via discovery signals, handles the recording state machine, and provides a library for past recordings.
- **Data Plane (External Local Workers)**: Decoupled recorders (FFmpeg/yt-dlp) that poll the API for active targets, execute the recording locally, and upload files to Supabase Storage.

## 📁 Project Structure

```text
src/
  ai/           # GenAI log summarization
  app/          # Routes (Auth, Admin, API)
  core/         
    providers/  # Scraper logic for TikTok/YouTube/Twitch (Diagnostics only)
    engine/     # Recording state machine & lifecycle management
  lib/          # Supabase, Actions & Shared Utilities
  types/        # Strict Database Definitions
```

## 🛠️ Setup Instructions

### 1. Supabase Setup
- Run the SQL migrations to set up `targets`, `recordings`, and `system_logs`.
- Create `recordings` and `thumbnails` buckets in **Storage**.

### 2. Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.
- `SUPABASE_SERVICE_ROLE_KEY`: For worker-level database access.
- `GEMINI_API_KEY`: For AI Log Summarization.

### 3. Local Worker Integration
External workers must poll the control plane to find tasks. See the **Worker Guide** in the Admin panel for the full API protocol.

---
**Vigilive Cloud Core** | Control Plane v1.0
