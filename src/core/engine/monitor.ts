import { createAdminClient } from '@/lib/supabase/admin';
import { TikTokProvider } from '@/core/providers/tiktok-scraper';
import { initiateRecording } from './lifecycle';
import { Target } from '@/types/database';

/**
 * Monitoring Engine: Iterates through active targets and checks live status.
 * Uses Admin Client for server-side processing.
 */
export async function runMonitoringCycle() {
  const supabase = createAdminClient();

  // 1. Fetch targets where monitoring is active and enabled
  const { data: targets, error } = await supabase
    .from('targets')
    .select('*')
    .eq('status', 'active')
    .eq('monitor_enabled', true);

  if (error) {
    console.error('Failed to fetch targets for monitoring:', error.message);
    return { success: false, error: error.message };
  }

  const results = [];
  const providers = {
    tiktok: new TikTokProvider(),
  };

  for (const target of (targets as unknown as Target[])) {
    try {
      const provider = providers[target.provider as keyof typeof providers];
      if (!provider) {
        console.warn(`No provider implementation for ${target.provider}`);
        continue;
      }

      // Check status
      const status = await provider.checkStatus(target.external_identifier);
      
      const updates: any = {
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (status.isLive) {
        updates.last_live_at = new Date().toISOString();
        
        // Initiate recording job (includes duplicate check internally)
        const recording = await initiateRecording(
          target.id, 
          status.title || target.name, 
          target.provider,
          status.streamUrl // Storing the stream URL in external_stream_id
        );

        if (!recording) {
          // Log skipping
          await supabase.from('system_logs').insert([{
            level: 'info',
            message: `Skipping recording for ${target.name}: Active job already exists.`,
            target_id: target.id
          }]);
        }
      }

      await supabase
        .from('targets')
        .update(updates)
        .eq('id', target.id);

      results.push({ targetId: target.id, isLive: status.isLive });

    } catch (err: any) {
      console.error(`Error monitoring target ${target.id}:`, err.message);
      await supabase.from('system_logs').insert([{
        level: 'error',
        message: `Monitoring failed for target ${target.id}`,
        target_id: target.id,
        context: { error: err.message }
      }]);
    }
  }

  return { success: true, processed: results.length, results };
}
