'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TargetStatus } from '@/types/database';
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
      status: 'paused' as TargetStatus,
      monitor_enabled: false,
      check_interval_seconds: 60,
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);

  if (error) throw new Error(error.message);
  
  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `Target created: ${formData.external_identifier}`,
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
 * Runs a one-off detection test for a target and returns diagnostics.
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
    throw new Error(`Provider ${target.provider} test not implemented yet.`);
  }

  const result = await provider.checkStatus(target.external_identifier);

  // Log the test attempt
  await supabase.from('system_logs').insert([{
    level: result.isLive ? 'info' : 'warn',
    message: `DETECTION_TEST: ${target.name} check returned isLive=${result.isLive}`,
    target_id: id,
    context: { diagnostics: result.diagnostics, metadata: result.metadata }
  }]);

  return result;
}
