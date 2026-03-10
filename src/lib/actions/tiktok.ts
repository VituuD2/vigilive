
'use server';

import { lookupTikTokProfile, TikTokProfile } from '@/lib/services/tiktok';

/**
 * Server action to search for TikTok profiles.
 * This is used by the debounced search component.
 */
export async function searchTikTokProfiles(query: string): Promise<TikTokProfile[]> {
  try {
    // Basic validation
    if (!query || query.trim().length < 2) return [];
    
    // Call the service layer
    const results = await lookupTikTokProfile(query.trim());
    return results;
  } catch (error) {
    console.error('TikTok Search Error:', error);
    return [];
  }
}
