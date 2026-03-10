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
      updated_at: new Date().toISOString(),
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
    context: updates
  }]);

  return data;
}

/**
 * Creates a new recording job if a live stream is detected.
 */
export async function initiateRecording(targetId: string, title: string, provider: string) {
  const supabase = await createClient();

  // 1. Check for existing active recordings
  const { data: existing } = await supabase
    .from('recordings')
    .select('id')
    .eq('target_id', targetId)
    .in('status', ['processing', 'recording'])
    .single();

  if (existing) {
    return null;
  }

  // 2. Create the pending recording
  const { data, error } = await supabase
    .from('recordings')
    .insert([{
      target_id: targetId,
      status: 'processing' as RecordingStatus,
      title,
      provider,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  return data;
}
