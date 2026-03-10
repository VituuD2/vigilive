
# Vigilive Admin: Operational Control Center

Autonomous stream archiving and cloud recording platform. Monitors authorized live sources (TikTok, YouTube, Twitch) via public scraping and manages a distributed recording pipeline.

## 🚀 Core Architecture

- **Web Control Plane (Next.js/Supabase)**: Manages targets, monitors status via public scraping, handles the recording state machine, and provides a library for past recordings.
- **Data Plane (External Workers)**: Decoupled recorders (FFmpeg/yt-dlp) that poll the API for pending tasks, execute the recording, and upload files to Supabase Storage.

## 📁 Project Structure
```text
src/
  ai/           # GenAI log summarization
  app/          # Routes (Auth, Admin, API)
  core/         
    providers/  # Scraper logic for TikTok/YouTube/Twitch
    engine/     # Recording state machine
  lib/          # Supabase & Shared Utilities
  types/        # Strict Database Definitions
```

## 🛠️ Setup Instructions

### 1. Supabase Setup
- Run the SQL migrations provided in the "Master Prompt" response to set up `targets`, `recordings`, and `system_logs`.
- In **Storage**, ensure buckets `recordings` and `thumbnails` are created.

### 2. Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.
- `GEMINI_API_KEY`: For AI Log Summarization.

### 3. Worker Integration
External workers should poll `GET /api/worker/tasks` to find the next available recording job. Once finished, they should `PATCH /api/worker/tasks` with the `recording_path` and `duration_seconds`.

---
**Vigilive Cloud Core** | Authorized Access Only.
