'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { initiateRecording, stopRecording } from '@/core/engine/lifecycle';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Manually enqueues a recording job for a specific target.
 */
export async function manualEnqueueRecording(targetId: string, title?: string, streamUrl?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: target, error: targetError } = await supabase
    .from('targets')
    .select('provider, name')
    .eq('id', targetId)
    .single();

  if (targetError || !target) throw new Error('Target not found');

  const recording = await initiateRecording(
    targetId,
    title || `Manual: ${target.name} - ${new Date().toLocaleString()}`,
    target.provider,
    streamUrl
  );

  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `MANUAL_ENQUEUE: User ${user.email} manually started recording for ${target.name}`,
    target_id: targetId,
    recording_id: recording.id,
    context: { user_id: user.id, stream_url: streamUrl, source: 'admin_ui' }
  }]);

  revalidatePath('/admin/recordings');
  revalidatePath('/admin');
  return { success: true, recordingId: recording.id };
}

/**
 * Stops an active recording.
 * Sets the status to 'completed', which the local worker polls for.
 */
export async function stopActiveRecording(recordingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await stopRecording(recordingId, user.id);
    
    await supabase.from('system_logs').insert([{
      level: 'info',
      message: `STOP_SIGNAL: Stop signal sent for recording ${recordingId}`,
      recording_id: recordingId,
      user_id: user.id,
      context: { source: 'admin_ui', action: 'manual_stop' }
    }]);

    revalidatePath('/admin/recordings');
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * Cleans up a stale recording job that might be stuck.
 * Sets status to failed and closes the timeline with ended_at.
 */
export async function cleanupStaleRecording(recordingId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('recordings')
    .update({ 
      status: 'failed', 
      error_message: 'Stale job cleaned up by operator (forced fail)',
      locked_at: null,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', recordingId);

  if (error) throw new Error(error.message);

  await supabase.from('system_logs').insert([{
    level: 'warn',
    message: `CLEANUP: Recording ${recordingId} was forced to FAILED state by operator`,
    recording_id: recordingId,
    context: { source: 'admin_ui', action: 'force_cleanup' }
  }]);

  revalidatePath('/admin/recordings');
  return { success: true };
}
