export type ConversionStatus = 'pending' | 'converting' | 'success' | 'failed';

export interface QueueItem {
  id: string;
  sourcePath: string;
  sourceName: string;
  sourceExt: string;
  fileSize?: number;
  outputPath?: string;
  status: ConversionStatus;
  error?: string;
  addedAt: number;
  completedAt?: number;
}

export interface AppSettings {
  overwrite: boolean;
  concurrency: number;
  customExecutablePath: string;
}

export interface DependencyStatus {
  available: boolean;
  executable_path: string;
  version?: string;
  error?: string;
}

export interface ConversionResult {
  source_path: string;
  output_path: string;
  success: boolean;
  error?: string;
}

export interface ConversionProgressPayload {
  id: string;
  source_path: string;
  output_path?: string;
  status: ConversionStatus;
  error?: string;
}
