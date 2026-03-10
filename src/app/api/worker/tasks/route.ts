import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/worker/tasks
 * Returns the next processing recording job using an atomic PostgreSQL function.
 * This prevents race conditions in distributed worker environments.
 */
export async function GET() {
  const supabase = createAdminClient();
  
  // Call the atomic RPC function
  const { data, error } = await supabase.rpc('claim_recording_task');

  if (error) {
    console.error('RPC claim_recording_task error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ task: null });
  }

  const task = data[0];

  // Log the claim
  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `Worker successfully claimed recording job ${task.id} (Target: ${task.target_name})`,
    recording_id: task.id,
    target_id: task.target_id
  }]);

  return NextResponse.json({ task });
}

/**
 * PATCH /api/worker/tasks
 * Allows worker to update progress and finish recordings using Admin Client.
 */
export async function PATCH(request: Request) {
  const body = await request.json();
  const { recordingId, status, storagePath, errorMessage, durationSeconds, fileSizeBytes } = body;

  const supabase = createAdminClient();

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
    // Releasing the lock happens naturally by changing status
    // but we can explicitly null it if needed for audit.
    updates.locked_at = null; 
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
    message: `Worker task ${recordingId} update received: ${status}`,
    recording_id: recordingId,
    context: { storagePath, durationSeconds, error: errorMessage }
  }]);

  return NextResponse.json({ success: true });
}
