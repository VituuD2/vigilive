'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TargetStatus } from '@/types/database';

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
  
  // When resuming, ensure monitor_enabled is true
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
