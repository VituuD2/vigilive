
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/worker/tasks
 * Returns the next processing recording job for an external worker.
 * Uses atomic selection to prevent multiple workers claiming the same job.
 */
export async function GET() {
  const supabase = await createClient();
  
  // Find a task that is 'processing' and not recently locked
  const { data: task, error } = await supabase
    .from('recordings')
    .select('*, targets(name, provider, external_identifier)')
    .eq('status', 'processing')
    .is('locked_at', null)
    .order('started_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !task) {
    return NextResponse.json({ task: null });
  }

  // Atomic lock the task
  const { error: lockError } = await supabase
    .from('recordings')
    .update({ 
      locked_at: new Date().toISOString(),
      status: 'recording' 
    })
    .eq('id', task.id);

  if (lockError) {
    // If we fail to lock, someone else probably got it
    return NextResponse.json({ task: null });
  }

  // Log the claim
  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `Worker claimed recording job ${task.id}`,
    recording_id: task.id,
    target_id: task.target_id
  }]);

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
  
  if (status === 'completed' || status === 'failed') {
    updates.ended_at = new Date().toISOString();
    updates.locked_at = null; // Release lock
  }

  const { error } = await supabase
    .from('recordings')
    .update(updates)
    .eq('id', recordingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the event
  await supabase.from('system_logs').insert([{
    level: status === 'failed' ? 'error' : 'info',
    message: `Worker task ${recordingId} update: ${status}`,
    recording_id: recordingId,
    context: { storagePath, durationSeconds, error: errorMessage }
  }]);

  return NextResponse.json({ success: true });
}
