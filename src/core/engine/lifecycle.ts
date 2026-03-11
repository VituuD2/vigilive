import { createAdminClient } from '@/lib/supabase/admin';
import { RecordingStatus } from '@/types/database';

/**
 * Handles the state transitions of a recording job using the admin client.
 */
export async function transitionRecordingStatus(
  recordingId: string, 
  newStatus: RecordingStatus,
  updates: Record<string, any> = {}
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('recordings')
    .update({ 
      status: newStatus,
      ...updates,
      updated_at: new Date().toISOString(),
      ...(newStatus === 'completed' || newStatus === 'failed' ? { ended_at: new Date().toISOString(), locked_at: null } : {})
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
 * Terminates an active recording job.
 * This will be detected by the worker during status polling.
 */
export async function stopRecording(recordingId: string, userId?: string) {
  const supabase = createAdminClient();
  
  const { data: recording } = await supabase
    .from('recordings')
    .select('status, target_id')
    .eq('id', recordingId)
    .single();

  if (!recording || (recording.status !== 'recording' && recording.status !== 'processing')) {
    throw new Error('Recording is not in an active state.');
  }

  const { data, error } = await supabase
    .from('recordings')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      locked_at: null,
      error_message: 'Manually stopped by operator'
    })
    .eq('id', recordingId)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `MANUAL_STOP: Stop signal sent to worker for recording ${recordingId}`,
    recording_id: recordingId,
    target_id: recording.target_id,
    user_id: userId,
    context: { source: 'admin_action' }
  }]);

  return data;
}

/**
 * Creates a new recording job if a live stream is detected.
 * Prevents duplicates for targets already being recorded.
 */
export async function initiateRecording(targetId: string, title: string, provider: string, externalStreamId?: string) {
  const supabase = createAdminClient();

  // 1. Atomic check for active recordings
  const { data: existing } = await supabase
    .from('recordings')
    .select('id, status')
    .eq('target_id', targetId)
    .in('status', ['processing', 'recording'])
    .maybeSingle();

  if (existing) {
    return existing; // Return existing job so worker can reuse it
  }

  // 2. Create the processing recording
  const { data, error } = await supabase
    .from('recordings')
    .insert([{
      target_id: targetId,
      status: 'processing' as RecordingStatus,
      title: title || `Live Session - ${new Date().toLocaleDateString()}`,
      provider,
      external_stream_id: externalStreamId,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  return data;
}
