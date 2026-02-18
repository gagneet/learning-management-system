/**
 * Video Conferencing Service
 * 
 * Provides abstraction layer for video conferencing using Daily.co
 * Handles room creation, token generation, and recording management
 */

interface DailyRoomConfig {
  name: string;
  privacy: 'public' | 'private';
  properties: {
    enable_recording?: 'cloud' | 'local';
    enable_transcription?: boolean;
    max_participants?: number;
    enable_screenshare?: boolean;
    enable_chat?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
    exp?: number; // Room expiration timestamp
  };
}

interface DailyRoomResponse {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: {
    max_participants?: number;
    enable_recording?: string;
    enable_transcription?: boolean;
  };
}

interface DailyTokenConfig {
  room_name: string;
  user_name: string;
  user_id: string;
  is_owner?: boolean;
  enable_recording?: boolean;
  start_video_off?: boolean;
  start_audio_off?: boolean;
  exp?: number; // Token expiration timestamp (unix)
}

interface DailyTokenResponse {
  token: string;
}

interface RecordingConfig {
  room_name: string;
  instance_id?: string;
}

interface RecordingResponse {
  id: string;
  room_name: string;
  start_ts: number;
  status: 'started' | 'finished' | 'processing' | 'ready' | 'error';
  max_participants?: number;
  duration?: number;
  share_token?: string;
}

/**
 * Daily.co Video Service
 */
export class VideoService {
  private apiKey: string;
  private domain: string;
  private baseUrl = 'https://api.daily.co/v1';

  constructor() {
    this.apiKey = process.env.DAILY_API_KEY || '';
    this.domain = process.env.DAILY_DOMAIN || '';

    if (!this.apiKey) {
      console.warn('DAILY_API_KEY not configured. Video conferencing will not work.');
    }
    if (!this.domain) {
      console.warn('DAILY_DOMAIN not configured. Using default domain.');
    }
  }

  /**
   * Check if video service is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.domain);
  }

  /**
   * Create a new video room
   */
  async createRoom(config: {
    sessionId: string;
    maxParticipants?: number;
    enableRecording?: boolean;
    enableTranscription?: boolean;
    expiresAt?: Date;
  }): Promise<DailyRoomResponse> {
    if (!this.isConfigured()) {
      throw new Error('Video service not configured');
    }

    const roomName = `session-${config.sessionId}`;
    
    // Calculate expiration (default: 24 hours from now)
    const exp = config.expiresAt 
      ? Math.floor(config.expiresAt.getTime() / 1000)
      : Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    const roomConfig: DailyRoomConfig = {
      name: roomName,
      privacy: 'private',
      properties: {
        enable_recording: config.enableRecording ? 'cloud' : undefined,
        enable_transcription: config.enableTranscription || false,
        max_participants: config.maxParticipants || 10,
        enable_screenshare: true,
        enable_chat: false, // Use our own chat system
        start_video_off: false,
        start_audio_off: false,
        exp,
      },
    };

    const response = await fetch(`${this.baseUrl}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(roomConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create video room: ${error}`);
    }

    return response.json();
  }

  /**
   * Get video room details
   */
  async getRoom(roomName: string): Promise<DailyRoomResponse> {
    if (!this.isConfigured()) {
      throw new Error('Video service not configured');
    }

    const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get video room: ${error}`);
    }

    return response.json();
  }

  /**
   * Delete a video room
   */
  async deleteRoom(roomName: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Video service not configured');
    }

    const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete video room: ${error}`);
    }
  }

  /**
   * Generate a meeting token for a user
   */
  async generateToken(config: {
    sessionId: string;
    userId: string;
    userName: string;
    isTutor?: boolean;
    enableRecording?: boolean;
    expiresIn?: number; // Expiration in seconds (default: 1 hour)
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Video service not configured');
    }

    const roomName = `session-${config.sessionId}`;
    
    // Calculate expiration (default: 1 hour from now)
    const expiresIn = config.expiresIn || 3600; // 1 hour
    const exp = Math.floor(Date.now() / 1000) + expiresIn;

    const tokenConfig: DailyTokenConfig = {
      room_name: roomName,
      user_name: config.userName,
      user_id: config.userId,
      is_owner: config.isTutor || false,
      enable_recording: config.enableRecording || false,
      exp,
    };

    const response = await fetch(`${this.baseUrl}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(tokenConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate meeting token: ${error}`);
    }

    const data: DailyTokenResponse = await response.json();
    return data.token;
  }

  /**
   * Start recording a session
   */
  async startRecording(sessionId: string): Promise<RecordingResponse> {
    if (!this.isConfigured()) {
      throw new Error('Video service not configured');
    }

    const roomName = `session-${sessionId}`;

    const response = await fetch(`${this.baseUrl}/recordings/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        room_name: roomName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to start recording: ${error}`);
    }

    return response.json();
  }

  /**
   * Stop recording a session
   */
  async stopRecording(sessionId: string): Promise<RecordingResponse> {
    if (!this.isConfigured()) {
      throw new Error('Video service not configured');
    }

    const roomName = `session-${sessionId}`;

    const response = await fetch(`${this.baseUrl}/recordings/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        room_name: roomName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to stop recording: ${error}`);
    }

    return response.json();
  }

  /**
   * Get recording details
   */
  async getRecording(recordingId: string): Promise<RecordingResponse> {
    if (!this.isConfigured()) {
      throw new Error('Video service not configured');
    }

    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get recording: ${error}`);
    }

    return response.json();
  }

  /**
   * List recordings for a room
   */
  async listRecordings(sessionId: string): Promise<RecordingResponse[]> {
    if (!this.isConfigured()) {
      throw new Error('Video service not configured');
    }

    const roomName = `session-${sessionId}`;

    const response = await fetch(
      `${this.baseUrl}/recordings?room_name=${encodeURIComponent(roomName)}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list recordings: ${error}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Video service not configured');
    }

    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete recording: ${error}`);
    }
  }

  /**
   * Get room URL for a session
   */
  getRoomUrl(sessionId: string): string {
    if (!this.domain) {
      throw new Error('DAILY_DOMAIN not configured');
    }
    return `https://${this.domain}/session-${sessionId}`;
  }

  /**
   * Validate webhook signature (for webhook endpoint security)
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Daily.co uses HMAC-SHA256 for webhook signatures
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }
}

// Export singleton instance
export const videoService = new VideoService();

// Export types
export type {
  DailyRoomConfig,
  DailyRoomResponse,
  DailyTokenConfig,
  RecordingConfig,
  RecordingResponse,
};
