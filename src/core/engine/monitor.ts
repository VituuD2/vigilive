
import { createClient } from '@/lib/supabase/server';
import { TikTokProvider } from '@/core/providers/tiktok-scraper';
import { initiateRecording } from './lifecycle';
import { Target } from '@/types/database';

/**
 * Monitoring Engine: Iterates through active targets and checks live status.
 */
export async function runMonitoringCycle() {
  const supabase = await createClient();

  // 1. Fetch active targets
  const { data: targets, error } = await supabase
    .from('targets')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('Failed to fetch targets for monitoring:', error.message);
    return { success: false, error: error.message };
  }

  const results = [];
  const providers = {
    tiktok: new TikTokProvider(),
    // Add other providers as they are implemented
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
      
      // Update target check timestamp
      const updates: any = {
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (status.isLive) {
        updates.last_live_at = new Date().toISOString();
        
        // Initiate recording job
        await initiateRecording(
          target.id, 
          status.title || target.name, 
          target.provider,
          status.metadata?.roomId
        );
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
