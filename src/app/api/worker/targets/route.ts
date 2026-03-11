import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/worker/targets
 * Returns all targets that are active and need monitoring.
 */
export async function GET() {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('targets')
    .select('id, name, provider, external_identifier')
    .eq('status', 'active')
    .eq('monitor_enabled', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ targets: data });
}

/**
 * PATCH /api/worker/targets/[id]
 * Updates discovery health for a specific target.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const { last_discovery_status, last_discovery_error, is_live } = body;

  const supabase = createAdminClient();
  
  const updates: any = {
    last_discovery_status,
    last_discovery_error,
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (is_live) {
    updates.last_live_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('targets')
    .update(updates)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
