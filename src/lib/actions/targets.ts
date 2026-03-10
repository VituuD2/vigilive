
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TikTokScraper } from '@/core/providers/tiktok-scraper';

const targetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.enum(['youtube', 'twitch', 'rtmp', 'tiktok']),
  external_identifier: z.string().min(1, 'Source Identifier is required'),
});

export async function createTarget(formData: z.infer<typeof targetSchema>) {
  const supabase = await createClient();
  
  let roomId = null;
  let avatarUrl = undefined;
  let displayName = undefined;

  // For TikTok, we perform an initial scrape to get the RoomID and profile info
  if (formData.provider === 'tiktok') {
    const profile = await TikTokScraper.getRoomId(formData.external_identifier);
    roomId = profile.roomId;
    avatarUrl = profile.avatar;
    displayName = profile.nickname;
  }

  const { error } = await supabase
    .from('targets')
    .insert([{
      ...formData,
      room_id: roomId,
      avatar_url: avatarUrl,
      display_name: displayName,
      monitoring_status: 'active',
      created_at: new Date().toISOString(),
    }]);

  if (error) throw new Error(error.message);
  
  await supabase.from('system_logs').insert([{
    level: 'info',
    message: `Target created: ${formData.external_identifier} via Scraper`,
    payload: { roomId }
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
    .update({ monitoring_status: status })
    .eq('id', id);
    
  if (error) throw new Error(error.message);

  revalidatePath('/admin/targets');
  revalidatePath('/admin');
  return { success: true };
}
