import { createAdminClient } from '@/lib/supabase/admin';
import { TikTokProvider } from '@/core/providers/tiktok-scraper';
import { initiateRecording } from './lifecycle';
import { Target } from '@/types/database';

/**
 * Discovery Engine: Autonomous monitor that discovers live streams and triggers recordings.
 * Persists health status and discovery diagnostics directly to targets.
 */
export async function runMonitoringCycle() {
  const supabase = createAdminClient();
  const isDebug = process.env.MONITOR_DEBUG === 'true';

  // 1. Fetch targets where monitoring is active
  const { data: targets, error } = await supabase
    .from('targets')
    .select('*')
    .eq('status', 'active')
    .eq('monitor_enabled', true);

  if (error) {
    console.error('Failed to fetch targets for discovery:', error.message);
    return { success: false, error: error.message };
  }

  const results = [];
  const providers = {
    tiktok: new TikTokProvider(),
    // youtube: new YouTubeProvider(), // Placeholder for future expansion
  };

  for (const target of (targets as unknown as Target[])) {
    try {
      const provider = (providers as any)[target.provider];
      if (!provider) {
        await updateDiscoveryStatus(target.id, 'failed', `No provider for ${target.provider}`);
        continue;
      }

      if (!provider.validateIdentifier(target.external_identifier)) {
        await updateDiscoveryStatus(target.id, 'failed', 'Invalid identifier format');
        continue;
      }

      // Check status with timeout and diagnostics
      const status = await provider.checkStatus(target.external_identifier);
      
      const targetUpdates: any = {
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (status.isLive) {
        targetUpdates.last_live_at = new Date().toISOString();
        targetUpdates.last_discovery_status = 'success';
        targetUpdates.last_discovery_error = null;
        
        // Auto-create recording job
        const recording = await initiateRecording(
          target.id, 
          status.title || target.name, 
          target.provider,
          status.streamUrl 
        );

        if (recording) {
          await supabase.from('system_logs').insert([{
            level: 'info',
            message: `AUTO_RECORD: Live detected for ${target.name}. Job ${recording.id} enqueued.`,
            target_id: target.id,
            recording_id: recording.id,
            context: { diagnostics: status.diagnostics }
          }]);
        }
      } else {
        const hasErrors = status.diagnostics?.some(d => !d.success);
        targetUpdates.last_discovery_status = hasErrors ? 'failed' : 'offline';
        targetUpdates.last_discovery_error = hasErrors 
          ? status.diagnostics?.find(d => !d.success)?.message || 'Discovery error'
          : null;

        if (hasErrors || isDebug) {
          await supabase.from('system_logs').insert([{
            level: hasErrors ? 'warn' : 'debug',
            message: `Discovery check: ${target.name} is ${hasErrors ? 'failing' : 'offline'}`,
            target_id: target.id,
            context: { diagnostics: status.diagnostics }
          }]);
        }
      }

      await supabase.from('targets').update(targetUpdates).eq('id', target.id);
      results.push({ targetId: target.id, isLive: status.isLive });

    } catch (err: any) {
      console.error(`Discovery exception for target ${target.id}:`, err.message);
      await updateDiscoveryStatus(target.id, 'failed', err.message);
    }
  }

  return { success: true, processed: results.length, results };
}

async function updateDiscoveryStatus(targetId: string, status: string, errorMsg: string) {
  const supabase = createAdminClient();
  await supabase.from('targets').update({
    last_discovery_status: status,
    last_discovery_error: errorMsg,
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', targetId);
}
