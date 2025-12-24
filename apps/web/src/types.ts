export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export enum CallStatus {
  INACTIVE = 'INACTIVE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

export interface Appointment {
  id: string;
  callerName: string;
  companyName?: string;
  type: 'demo' | 'consultation' | 'technical_support' | 'partnership_discussion';
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface CallLog {
  id: string;
  timestamp: string;
  duration: number;
  callerName: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  visitorId?: string;
}

export interface Visitor {
  id: string;
  name: string;
  lastSeen: string;
  segmentId?: string;
  totalCalls: number;
  source: string;
  notes?: string;
}

export interface VisitorSegment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  visitorCount: number;
  color: string;
}

export interface Lead {
  id: string;
  visitorId: string;
  name: string;
  email?: string;
  phone: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  createdAt: string;
}

export interface ProactiveTask {
  id: string;
  title: string;
  assignedTo: string;
  deadline: string;
  status: 'pending' | 'completed' | 'overdue' | 'flagged';
  type: 'internal_assignment' | 'research_followup';
  reminderSent: boolean;
  callerName?: string;
}

export interface Attribute {
  id: string;
  key: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  description: string;
  defaultValue?: string;
}

export interface Entity {
  id: string;
  name: string;
  synonyms: string[];
  description: string;
}
