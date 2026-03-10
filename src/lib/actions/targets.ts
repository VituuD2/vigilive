
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const targetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.string().min(1, 'Provider is required'),
  external_identifier: z.string().min(1, 'External ID is required'),
});

export async function createTarget(formData: z.infer<typeof targetSchema>) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('targets')
    .insert([{
      ...formData,
      status: 'idle',
    }]);

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/targets');
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
  
  revalidatePath('/admin/targets');
  return { success: true };
}
