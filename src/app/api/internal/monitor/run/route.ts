
import { NextResponse } from 'next/server';
import { runMonitoringCycle } from '@/core/engine/monitor';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/internal/monitor/run
 * Protected route to trigger the monitoring loop.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const internalSecret = process.env.INTERNAL_MONITOR_SECRET;

  // Simple secret-based protection
  if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    
    // Log start of cycle
    await supabase.from('system_logs').insert([{
      level: 'info',
      message: 'Monitoring cycle started manually/scheduled',
      context: { source: 'api_trigger' }
    }]);

    const result = await runMonitoringCycle();
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
