import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/worker/tasks
 * Returns the next pending recording job for an external worker.
 */
export async function GET() {
  const supabase = await createClient();
  
  // Find a pending task
  const { data: task, error } = await supabase
    .from('recordings')
    .select('*, targets(provider, external_identifier)')
    .eq('status', 'processing')
    .order('started_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !task) {
    return NextResponse.json({ task: null });
  }

  return NextResponse.json({ task });
}

/**
 * PATCH /api/worker/tasks
 * Allows worker to update progress and finish recordings.
 */
export async function PATCH(request: Request) {
  const body = await request.json();
  const { recordingId, status, storagePath, errorMessage, durationSeconds, fileSizeBytes } = body;

  const supabase = await createClient();

  const updates: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  if (storagePath) updates.storage_path = storagePath;
  if (errorMessage) updates.error_message = errorMessage;
  if (durationSeconds) updates.duration_seconds = durationSeconds;
  if (fileSizeBytes) updates.file_size_bytes = fileSizeBytes;
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

  // Log the event using 'context' as per schema
  await supabase.from('system_logs').insert([{
    level: status === 'failed' ? 'error' : 'info',
    message: `Worker updated recording ${recordingId} to ${status}`,
    recording_id: recordingId,
    context: { storagePath, durationSeconds }
  }]);

  return NextResponse.json({ success: true });
}
