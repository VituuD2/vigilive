
import { TargetProvider } from '@/types/database';

export interface StreamStatus {
  isLive: boolean;
  streamUrl?: string;
  title?: string;
  metadata?: Record<string, any>;
  diagnostics?: {
    step: string;
    success: boolean;
    message: string;
    statusCode?: number;
    error?: string;
  }[];
}

export abstract class LiveProvider {
  abstract readonly type: TargetProvider;
  
  /**
   * Validates the identifier for this provider
   */
  abstract validateIdentifier(identifier: string): boolean;

  /**
   * Checks if the target is currently live
   */
  abstract checkStatus(identifier: string): Promise<StreamStatus>;
}
