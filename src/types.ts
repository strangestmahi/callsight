export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  status: 'incoming' | 'in-call' | 'completed' | 'declined' | 'missed';
  durationSeconds: number;
  hasTranscript: boolean;
  callerConsent: boolean;
  calleeConsent: boolean;
  startedAt: string;
  endedAt?: string;
}

export interface SmartHighlight {
  id?: string;
  highlightType: 'date_time' | 'question' | 'number' | 'action_item' | 'name' | string;
  text: string;
  context?: string;
}

export interface TranscriptItem {
  id: string;
  callId: string;
  speakerId: string;
  speakerName: string;
  text: string;
  confidence: number;
  timestampMs: number;
  isFinal: boolean;
  highlights?: SmartHighlight[];
}

export interface ChatMessage {
  id: string;
  callId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

export type ScreenType = 
  | 'welcome'
  | 'login'
  | 'register'
  | 'home'
  | 'active_call'
  | 'silent_reading'
  | 'history'
  | 'transcript_detail'
  | 'settings';
