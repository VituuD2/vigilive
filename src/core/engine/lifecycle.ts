
import { createClient } from '@/lib/supabase/server';
import { RecordingStatus } from '@/types/database';

/**
 * Handles the state transitions of a recording job.
 * This is the source of truth for the recording state machine.
 */
export async function transitionRecordingStatus(
  recordingId: string, 
  newStatus: RecordingStatus,
  updates: Record<string, any> = {}
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recordings')
    .update({ 
      status: newStatus,
      ...updates,
      ...(newStatus === 'completed' || newStatus === 'failed' ? { ended_at: new Date().toISOString() } : {})
    })
    .eq('id', recordingId)
    .select()
    .single();

  if (error) throw error;

  // Log the transition
  await supabase.from('system_logs').insert([{
    level: newStatus === 'failed' ? 'error' : 'info',
    message: `Recording ${recordingId} transitioned to ${newStatus}`,
    recording_id: recordingId,
    target_id: data.target_id,
    payload: updates
  }]);

  return data;
}

/**
 * Creates a new recording job if a live stream is detected.
 * Uses a check to prevent duplicate active recordings for the same target.
 */
export async function initiateRecording(targetId: string, streamUrl: string) {
  const supabase = await createClient();

  // 1. Check for existing active recordings to prevent duplicates
  const { data: existing } = await supabase
    .from('recordings')
    .select('id')
    .eq('target_id', targetId)
    .in('status', ['pending', 'recording'])
    .single();

  if (existing) {
    console.log(`Recording already in progress for target ${targetId}`);
    return null;
  }

  // 2. Create the pending recording
  const { data, error } = await supabase
    .from('recordings')
    .insert([{
      target_id: targetId,
      status: 'pending',
      stream_url: streamUrl,
      started_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;

  return data;
}
