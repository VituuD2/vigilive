
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API for Recording Workers to poll for pending jobs.
 * Secure this with a shared SECRET_KEY in production.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  
  // In a real app, verify a Bearer token here
  // const authHeader = request.headers.get('authorization');

  const { data: tasks, error } = await supabase
    .from('recordings')
    .select('*, targets(provider, external_identifier)')
    .eq('status', 'pending')
    .order('started_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks });
}

/**
 * API for Workers to update job progress
 */
export async function PATCH(request: Request) {
  const body = await request.json();
  const { recordingId, status, recordingPath, errorMessage } = body;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recordings')
    .update({ 
      status, 
      recording_path: recordingPath,
      error_message: errorMessage,
      ...(status === 'completed' ? { ended_at: new Date().toISOString() } : {})
    })
    .eq('id', recordingId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
