
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const targetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.enum(['youtube', 'twitch', 'rtmp', 'tiktok']),
  external_identifier: z.string().min(1, 'Source Identifier is required'),
  platform_user_id: z.string().optional(),
  display_name: z.string().optional(),
  avatar_url: z.string().optional(),
});

export async function createTarget(formData: z.infer<typeof targetSchema>) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('targets')
    .insert([{
      ...formData,
      status: 'idle',
      created_at: new Date().toISOString(),
    }]);

  if (error) throw new Error(error.message);
  
  // Log the creation
  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `New target created: ${formData.name} (${formData.provider})`,
    created_at: new Date().toISOString()
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

export async function updateTargetStatus(id: string, status: 'active' | 'paused') {
  const supabase = await createClient();
  const { error } = await supabase
    .from('targets')
    .update({ status })
    .eq('id', id);
    
  if (error) throw new Error(error.message);

  // Log status change
  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `Target status updated to ${status} for ID: ${id}`,
    target_id: id,
    created_at: new Date().toISOString()
  }]);
  
  revalidatePath('/admin/targets');
  revalidatePath('/admin');
  return { success: true };
}
