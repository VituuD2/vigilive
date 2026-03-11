
import { createAdminClient } from '@/lib/supabase/admin';
import { TikTokProvider } from '@/core/providers/tiktok-scraper';
import { initiateRecording } from './lifecycle';
import { Target } from '@/types/database';

/**
 * Monitoring Engine: Iterates through active targets and checks live status.
 * Enhanced with diagnostics and robust logging.
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
    console.error('Failed to fetch targets for monitoring:', error.message);
    return { success: false, error: error.message };
  }

  if (isDebug) {
    console.log(`[Monitor] Starting cycle for ${targets?.length || 0} targets...`);
  }

  const results = [];
  const providers = {
    tiktok: new TikTokProvider(),
  };

  for (const target of (targets as unknown as Target[])) {
    try {
      if (isDebug) console.log(`[Monitor] Checking target: ${target.name} (${target.external_identifier})`);

      const provider = providers[target.provider as keyof typeof providers];
      if (!provider) {
        await supabase.from('system_logs').insert([{
          level: 'warn',
          message: `Monitoring skipped for ${target.name}: No provider implementation for ${target.provider}`,
          target_id: target.id,
          context: { provider: target.provider }
        }]);
        continue;
      }

      // Validate identifier
      if (!provider.validateIdentifier(target.external_identifier)) {
        await supabase.from('system_logs').insert([{
          level: 'error',
          message: `Validation failed for ${target.name}: Invalid identifier format`,
          target_id: target.id,
          context: { identifier: target.external_identifier, provider: target.provider }
        }]);
        continue;
      }

      // Check status with diagnostics
      const status = await provider.checkStatus(target.external_identifier);
      
      const updates: any = {
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (status.isLive) {
        updates.last_live_at = new Date().toISOString();
        
        // Initiate recording job
        const recording = await initiateRecording(
          target.id, 
          status.title || target.name, 
          target.provider,
          status.streamUrl 
        );

        if (!recording) {
          if (isDebug) console.log(`[Monitor] Skipping recording for ${target.name}: Job already exists.`);
        } else {
          await supabase.from('system_logs').insert([{
            level: 'info',
            message: `LIVE_DETECTED: Created recording job for ${target.name}`,
            target_id: target.id,
            recording_id: recording.id,
            context: { ...status.metadata, diagnostics: status.diagnostics }
          }]);
        }
      } else {
        // If not live, but we have diagnostics indicating errors or if in debug mode, log the check
        const hasErrors = status.diagnostics?.some(d => !d.success);
        if (hasErrors || isDebug) {
          await supabase.from('system_logs').insert([{
            level: hasErrors ? 'warn' : 'debug',
            message: `Target check completed: ${target.name} is offline`,
            target_id: target.id,
            context: { 
              isLive: false, 
              diagnostics: status.diagnostics,
              metadata: status.metadata
            }
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
        message: `Monitoring exception for target ${target.id}`,
        target_id: target.id,
        context: { error: err.message, stack: err.stack }
      }]);
    }
  }

  if (isDebug) console.log(`[Monitor] Cycle complete. Processed ${results.length} targets.`);
  return { success: true, processed: results.length, results };
}
