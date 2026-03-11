'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TargetStatus, DiscoveryStatus } from '@/types/database';
import { TikTokProvider } from '@/core/providers/tiktok-scraper';

const targetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.enum(['youtube', 'twitch', 'rtmp', 'tiktok'] as const),
  external_identifier: z.string().min(1, 'Source Identifier is required'),
});

export async function createTarget(formData: z.infer<typeof targetSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('targets')
    .insert([{
      name: formData.name,
      provider: formData.provider,
      external_identifier: formData.external_identifier,
      status: 'active' as TargetStatus,
      monitor_enabled: true,
      check_interval_seconds: 60,
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);

  if (error) throw new Error(error.message);
  
  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `Fleet expansion: Added ${formData.external_identifier}`,
    context: { provider: formData.provider }
  }]);

  revalidatePath('/admin/targets');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteTarget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('targets').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/targets');
  return { success: true };
}

export async function updateTargetStatus(id: string, status: TargetStatus) {
  const supabase = await createClient();
  const monitor_enabled = status === 'active';

  const { error } = await supabase
    .from('targets')
    .update({ 
      status,
      monitor_enabled,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
    
  if (error) throw new Error(error.message);

  revalidatePath('/admin/targets');
  revalidatePath('/admin');
  return { success: true };
}

/**
 * Runs a health check for a target and updates discovery state.
 */
export async function testTargetDetection(id: string) {
  const supabase = await createClient();
  const { data: target, error: targetError } = await supabase
    .from('targets')
    .select('*')
    .eq('id', id)
    .single();

  if (targetError || !target) throw new Error('Target not found');

  let provider;
  if (target.provider === 'tiktok') {
    provider = new TikTokProvider();
  } else {
    throw new Error(`Health check for ${target.provider} not implemented.`);
  }

  const result = await provider.checkStatus(target.external_identifier);

  // Persist discovery health
  const hasErrors = result.diagnostics?.some(d => !d.success);
  const discoveryStatus: DiscoveryStatus = result.isLive ? 'success' : (hasErrors ? 'failed' : 'offline');
  const discoveryError = hasErrors ? result.diagnostics?.find(d => !d.success)?.message : null;

  await supabase.from('targets').update({
    last_discovery_status: discoveryStatus,
    last_discovery_error: discoveryError,
    last_checked_at: new Date().toISOString()
  }).eq('id', id);

  await supabase.from('system_logs').insert([{
    level: result.isLive ? 'info' : (hasErrors ? 'error' : 'warn'),
    message: `HEALTH_CHECK: ${target.name} discovery status: ${discoveryStatus}`,
    target_id: id,
    context: { diagnostics: result.diagnostics }
  }]);

  revalidatePath('/admin/targets');
  return result;
}
