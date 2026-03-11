
/**
 * @fileOverview TikTok Public Scraper Provider
 * Implements public profile metadata extraction and Live API status checks with diagnostics.
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
    const diagnostics: StreamStatus['diagnostics'] = [];
    const timeout = 10000; // 10s timeout

    try {
      // 1. Get Room ID via public profile
      diagnostics.push({ step: 'profile_fetch', success: false, message: `Fetching profile for ${cleanUsername}` });
      
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const profileResponse = await fetch(`https://www.tiktok.com/@${cleanUsername}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        next: { revalidate: 0 },
        signal: controller.signal
      });
      
      clearTimeout(id);
      
      const lastDiag = diagnostics[diagnostics.length - 1];
      lastDiag.statusCode = profileResponse.status;

      if (!profileResponse.ok) {
        lastDiag.message = `Profile fetch failed with status ${profileResponse.status}`;
        return { isLive: false, diagnostics };
      }

      lastDiag.success = true;
      const html = await profileResponse.text();
      
      // 2. Extract Room ID
      diagnostics.push({ step: 'room_id_extraction', success: false, message: 'Parsing HTML for roomId' });
      const roomIdMatch = html.match(/"roomId":"(\d+)"/);
      
      if (!roomIdMatch || !roomIdMatch[1] || roomIdMatch[1] === '0') {
        const parseDiag = diagnostics[diagnostics.length - 1];
        parseDiag.message = 'Room ID not found in HTML. User might be offline or page structure changed.';
        // Optional: log a snippet of HTML in debug logs if needed, but not in DB diagnostics
        return { isLive: false, diagnostics };
      }

      const roomId = roomIdMatch[1];
      diagnostics[diagnostics.length - 1].success = true;
      diagnostics[diagnostics.length - 1].message = `Found Room ID: ${roomId}`;

      // 3. Check Live Detail API
      diagnostics.push({ step: 'live_detail_api', success: false, message: `Calling Live Detail API for room ${roomId}` });
      
      const apiController = new AbortController();
      const apiId = setTimeout(() => apiController.abort(), timeout);

      const apiResponse = await fetch(`https://www.tiktok.com/api/live/detail/?aid=1988&roomID=${roomId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        next: { revalidate: 0 },
        signal: apiController.signal
      });
      
      clearTimeout(apiId);
      
      const apiDiag = diagnostics[diagnostics.length - 1];
      apiDiag.statusCode = apiResponse.status;

      if (!apiResponse.ok) {
        apiDiag.message = `Live Detail API failed with status ${apiResponse.status}`;
        return { isLive: false, diagnostics, metadata: { roomId } };
      }

      const data = await apiResponse.json();
      apiDiag.success = true;

      const isLive = data.data?.status === 2;
      let streamUrl = '';

      if (isLive && data.data?.pull_data?.stream_data) {
        try {
          const streamData = JSON.parse(data.data.pull_data.stream_data);
          streamUrl = streamData.data.origin.main.hls || streamData.data.origin.main.flv;
        } catch (e) {
          diagnostics.push({ step: 'stream_url_parse', success: false, message: 'Failed to parse stream_data JSON' });
        }
      }

      return {
        isLive,
        streamUrl,
        title: data.data?.title,
        metadata: { roomId, apiStatus: data.data?.status },
        diagnostics
      };
    } catch (error: any) {
      const errorMsg = error.name === 'AbortError' ? 'Request timed out' : error.message;
      diagnostics.push({ 
        step: 'exception', 
        success: false, 
        message: 'An unexpected error occurred during status check', 
        error: errorMsg 
      });
      return { isLive: false, diagnostics };
    }
  }
}
