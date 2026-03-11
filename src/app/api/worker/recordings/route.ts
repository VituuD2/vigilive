import { createAdminClient } from '@/lib/supabase/admin';
import { initiateRecording } from '@/core/engine/lifecycle';
import { NextResponse } from 'next/server';

/**
 * POST /api/worker/recordings
 * Initiates a recording job for a target. 
 * If a 'processing' or 'recording' job already exists, returns it instead.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { target_id, title, provider, external_stream_id } = body;

  if (!target_id) {
    return NextResponse.json({ error: 'target_id is required' }, { status: 400 });
  }

  try {
    const recording = await initiateRecording(
      target_id,
      title,
      provider,
      external_stream_id
    );

    const supabase = createAdminClient();

    // If initiateRecording returned an existing job, we just return it.
    // Otherwise, we log the new creation.
    if (recording) {
      await supabase.from('system_logs').insert([{
        level: 'info',
        message: `WORKER_INIT: Recording job ${recording.id} started/retrieved via local worker`,
        target_id,
        recording_id: recording.id,
        context: { source: 'local_worker' }
      }]);
      
      return NextResponse.json({ recording });
    } else {
      // This case handles when initiateRecording returns null (already exists)
      // but we want to actually find it to return to the worker.
      const { data: existing } = await supabase
        .from('recordings')
        .select('*')
        .eq('target_id', target_id)
        .in('status', ['processing', 'recording'])
        .maybeSingle();
        
      return NextResponse.json({ recording: existing });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
