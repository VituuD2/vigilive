'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { initiateRecording } from '@/core/engine/lifecycle';
import { RecordingStatus } from '@/types/database';

/**
 * Manually enqueues a recording job for a specific target.
 * Bypasses the auto-detection loop.
 */
export async function manualEnqueueRecording(targetId: string, title?: string, streamUrl?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Fetch target details to get provider
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

  if (!recording) {
    throw new Error('An active recording job already exists for this target.');
  }

  // Log manual intervention
  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `MANUAL_ENQUEUE: User ${user.email} manually started recording for ${target.name}`,
    target_id: targetId,
    recording_id: recording.id,
    context: { user_id: user.id, stream_url: streamUrl }
  }]);

  revalidatePath('/admin/recordings');
  revalidatePath('/admin');
  return { success: true, recordingId: recording.id };
}
