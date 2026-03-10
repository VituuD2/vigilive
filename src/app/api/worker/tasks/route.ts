
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/worker/tasks
 * Returns the next pending recording job for an external worker.
 * Uses a "locked_at" timestamp to prevent race conditions.
 */
export async function GET() {
  const supabase = await createClient();
  
  // Find a pending task that isn't locked or was locked more than 5 minutes ago (timeout)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: task, error } = await supabase
    .from('recordings')
    .select('*, targets(provider, external_identifier)')
    .eq('status', 'pending')
    .or(`locked_at.is.null,locked_at.lt.${fiveMinutesAgo}`)
    .order('started_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !task) {
    return NextResponse.json({ task: null });
  }

  // Lock the task
  await supabase
    .from('recordings')
    .update({ locked_at: new Date().toISOString() })
    .eq('id', task.id);

  return NextResponse.json({ task });
}

/**
 * PATCH /api/worker/tasks
 * Allows worker to update progress and finish recordings.
 */
export async function PATCH(request: Request) {
  const body = await request.json();
  const { recordingId, status, recordingPath, errorMessage, durationSeconds } = body;

  const supabase = await createClient();

  const updates: any = { status };
  if (recordingPath) updates.recording_path = recordingPath;
  if (errorMessage) updates.error_message = errorMessage;
  if (durationSeconds) updates.duration_seconds = durationSeconds;
  if (status === 'completed' || status === 'failed') updates.ended_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('recordings')
    .update(updates)
    .eq('id', recordingId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the event
  await supabase.from('system_logs').insert([{
    level: status === 'failed' ? 'error' : 'info',
    message: `Worker updated recording ${recordingId} to ${status}`,
    recording_id: recordingId,
    payload: { recordingPath, durationSeconds }
  }]);

  return NextResponse.json({ success: true });
}
