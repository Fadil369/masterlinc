export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface Extension {
  Id: number;
  Number: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Department: string;
  CurrentProfile: string;
  Registered: boolean;
  QueueStatus: string;
}

export interface ActiveCall {
  Id: string;
  ParticipantId: string;
  Caller: string;
  Callee: string;
  Status: 'Ringing' | 'Talking' | 'Held' | 'Dialing';
  Direction: 'Inbound' | 'Outbound' | 'Internal';
  Duration: number;
  Extension: string;
  StartTime: string;
  Participants?: Array<{ Dn: string; DisplayName?: string }>;
}

export interface CallLogEntry {
  Id: number;
  CallId: string;
  SegmentId: number;
  Caller: string;
  Callee: string;
  StartTime: string;
  EndTime: string;
  Duration: number;
  DurationSeconds?: number;
  Direction: 'Inbound' | 'Outbound' | 'Internal';
  Status: 'Answered' | 'Missed' | 'Busy' | 'Failed';
  RecordingUrl?: string;
  Extension: string;
}

export interface Participant {
  Id: string;
  CallId: number;
  Status: string;
  Number: string;
  Name: string;
  Muted: boolean;
  OnHold: boolean;
}

export interface Message {
  Id: string;
  From: string;
  To: string;
  Body: string;
  Channel: 'sms' | 'whatsapp' | 'livechat';
  Direction: 'Inbound' | 'Outbound';
  Timestamp: string;
  Status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface PresenceStatus {
  Extension: string;
  Status: 'Available' | 'Away' | 'DND' | 'Lunch' | 'BusinessTrip' | 'Offline';
  StatusText?: string;
  OnCall: boolean;
}

export interface CallControlResponse {
  success: boolean;
  participantId?: string;
  message?: string;
  Id?: string;
}

export interface WebSocketEvent {
  event: string;
  data: {
    Dn?: string;
    Id?: number;
    ParticipantId?: string;
    Status?: string;
    Caller?: string;
    Callee?: string;
    [key: string]: unknown;
  };
}
