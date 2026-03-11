import { createAdminClient } from '@/lib/supabase/admin';
import { transitionRecordingStatus } from '@/core/engine/lifecycle';
import { NextResponse } from 'next/server';

/**
 * GET /api/worker/recordings/[id]
 * Used by workers to poll for status changes (e.g. Stop signal from UI).
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('recordings')
    .select('id, status, target_id')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ recording: data });
}

/**
 * PATCH /api/worker/recordings/[id]
 * Finalizes the recording job with storage path, duration, and final status.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const { status, storage_path, thumbnail_path, duration_seconds, file_size_bytes, error_message } = body;

  try {
    const recording = await transitionRecordingStatus(id, status, {
      storage_path,
      thumbnail_path,
      duration_seconds,
      file_size_bytes,
      error_message,
      ended_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null
    });

    return NextResponse.json({ recording });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
