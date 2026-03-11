'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TargetStatus, DiscoveryStatus, TargetProvider } from '@/types/database';
import { TikTokProvider } from '@/core/providers/tiktok-scraper';

const targetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.enum(['youtube', 'twitch', 'rtmp', 'tiktok'] as const),
  external_identifier: z.string().min(1, 'Source Identifier is required'),
});

/**
 * Normalizes identifiers (strips @, lowercase, trim)
 */
function normalizeIdentifier(id: string, provider: string): string {
  let normalized = id.trim().toLowerCase();
  if (provider === 'tiktok' || provider === 'instagram') {
    normalized = normalized.replace(/^@/, '');
  }
  return normalized;
}

export async function createTarget(formData: z.infer<typeof targetSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const normalizedId = normalizeIdentifier(formData.external_identifier, formData.provider);

  // Check for duplicates
  const { data: existing } = await supabase
    .from('targets')
    .select('id')
    .eq('provider', formData.provider)
    .eq('external_identifier', normalizedId)
    .maybeSingle();

  if (existing) {
    throw new Error(`A target for ${formData.provider} with identifier ${normalizedId} already exists in the fleet.`);
  }

  const { error } = await supabase
    .from('targets')
    .insert([{
      name: formData.name,
      provider: formData.provider,
      external_identifier: normalizedId,
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
    message: `Fleet expansion: Added ${formData.provider} target ${normalizedId}`,
    context: { provider: formData.provider, identifier: normalizedId, source: 'admin_ui' }
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
    context: { diagnostics: result.diagnostics, manual: true }
  }]);

  revalidatePath('/admin/targets');
  return result;
}
