
/**
 * @fileOverview TikTok Public Scraper Provider
 * Implements public profile metadata extraction and Live API status checks.
 */

import { LiveProvider, StreamStatus } from './base';
import { TargetProvider } from '@/types/database';

export class TikTokProvider extends LiveProvider {
  readonly type: TargetProvider = 'tiktok';

  validateIdentifier(identifier: string): boolean {
    return /^@?[\w\.]+$/.test(identifier);
  }

  async checkStatus(username: string): Promise<StreamStatus> {
    const cleanUsername = username.replace('@', '');
    try {
      // 1. Get Room ID via public profile
      const profileResponse = await fetch(`https://www.tiktok.com/@${cleanUsername}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        next: { revalidate: 0 }
      });
      const html = await profileResponse.text();
      const roomIdMatch = html.match(/"roomId":"(\d+)"/);
      
      if (!roomIdMatch || !roomIdMatch[1] || roomIdMatch[1] === '0') {
        return { isLive: false };
      }

      const roomId = roomIdMatch[1];

      // 2. Check Live Detail API
      const apiResponse = await fetch(`https://www.tiktok.com/api/live/detail/?aid=1988&roomID=${roomId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        next: { revalidate: 0 }
      });
      const data = await apiResponse.json();

      const isLive = data.data?.status === 2;
      let streamUrl = '';

      if (isLive && data.data?.pull_data?.stream_data) {
        const streamData = JSON.parse(data.data.pull_data.stream_data);
        streamUrl = streamData.data.origin.main.hls || streamData.data.origin.main.flv;
      }

      return {
        isLive,
        streamUrl,
        title: data.data?.title,
        metadata: { roomId }
      };
    } catch (error) {
      console.error('TikTok Scraper Error:', error);
      return { isLive: false };
    }
  }
}
