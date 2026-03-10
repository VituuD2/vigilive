
/**
 * @fileOverview TikTok Public Scraper Provider
 * Implements public profile metadata extraction and Live API status checks.
 */

export interface TikTokLiveStatus {
  isLive: boolean;
  roomId?: string;
  streamUrl?: string;
  title?: string;
}

export class TikTokScraper {
  /**
   * Scrapes the public profile to find the Room ID
   */
  static async getRoomId(username: string): Promise<{ roomId: string | null; avatar?: string; nickname?: string }> {
    const cleanUsername = username.replace('@', '');
    try {
      const response = await fetch(`https://www.tiktok.com/@${cleanUsername}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const html = await response.text();
      
      // Attempt to find roomId in script tags
      const roomIdMatch = html.match(/"roomId":"(\d+)"/);
      const avatarMatch = html.match(/"avatarLarger":"(.*?)"/);
      const nicknameMatch = html.match(/"nickname":"(.*?)"/);

      return {
        roomId: roomIdMatch ? roomIdMatch[1] : null,
        avatar: avatarMatch ? JSON.parse(`"${avatarMatch[1]}"`) : undefined,
        nickname: nicknameMatch ? JSON.parse(`"${nicknameMatch[1]}"`) : undefined
      };
    } catch (error) {
      console.error('TikTok Scraper Error:', error);
      return { roomId: null };
    }
  }

  /**
   * Checks the live status using the internal Web API
   */
  static async checkLiveStatus(roomId: string): Promise<TikTokLiveStatus> {
    try {
      const response = await fetch(`https://www.tiktok.com/api/live/detail/?aid=1988&roomID=${roomId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const data = await response.json();

      const isLive = data.data?.status === 2;
      let streamUrl = '';

      if (isLive && data.data?.pull_data?.stream_data) {
        const streamData = JSON.parse(data.data.pull_data.stream_data);
        // Prioritize the origin m3u8 stream
        streamUrl = streamData.data.origin.main.hls || streamData.data.origin.main.flv;
      }

      return {
        isLive,
        roomId,
        streamUrl,
        title: data.data?.title
      };
    } catch (error) {
      console.error('TikTok Live API Error:', error);
      return { isLive: false };
    }
  }
}
