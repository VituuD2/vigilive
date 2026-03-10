
import { createClient } from '@/lib/supabase/server';
import { RecordingStatus } from '@/types/database';

/**
 * Handles the state transitions of a recording job.
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
 * Prevents duplicates for targets already being recorded.
 */
export async function initiateRecording(targetId: string, title: string, provider: string, externalStreamId?: string) {
  const supabase = await createClient();

  // 1. Atomic check for active recordings
  const { data: existing } = await supabase
    .from('recordings')
    .select('id')
    .eq('target_id', targetId)
    .in('status', ['processing', 'recording'])
    .maybeSingle();

  if (existing) {
    return null;
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

  // 3. Log event
  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `LIVE_DETECTED: Created recording job ${data.id} for target ${targetId}`,
    target_id: targetId,
    recording_id: data.id,
    context: { title, provider }
  }]);

  return data;
}
