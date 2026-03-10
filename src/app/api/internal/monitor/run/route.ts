import { NextResponse } from 'next/server';
import { runMonitoringCycle } from '@/core/engine/monitor';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/internal/monitor/run
 * Protected internal route to trigger the monitoring loop.
 * Bypasses session - uses INTERNAL_MONITOR_SECRET and Admin Client.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const internalSecret = process.env.INTERNAL_MONITOR_SECRET;

  if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    
    await supabase.from('system_logs').insert([{
      level: 'info',
      message: 'Autonomous monitoring cycle triggered via internal API',
      context: { source: 'api_internal_trigger' }
    }]);

    const result = await runMonitoringCycle();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Internal Monitor API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function GET() {
  return NextResponse.json({ 
    status: "Operacional", 
    message: "A rota existe! Agora use POST para rodar o monitor." 
  });
}