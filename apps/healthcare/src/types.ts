export interface SearchResult {
  id: string
  type: 'provider' | 'facility'
  name: string
  title?: string
  description?: string
  rating: number
  location?: string
  address?: string
  languages?: string[]
  tags: string[]
  imageUrl: string
  available?: boolean
  status?: string
  statusColor?: string
  accreditation?: string
}

export interface Appointment {
  id: string
  patientName: string
  patientId: string
  providerName: string
  providerId: string
  date: string
  time: string
  type: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  reason: string
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  recipientId: string
  content: string
  timestamp: string
  read: boolean
  attachments?: string[]
}

export interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantAvatar: string
  participantRole: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export interface Patient {
  id: string
  name: string
  dateOfBirth: string
  gender: string
  phone: string
  email: string
  address: string
  insurance: {
    provider: string
    policyNumber: string
    groupNumber: string
  }
  medicalHistory: string[]
  allergies: string[]
  medications: string[]
}

export interface Facility {
  id: string
  name: string
  type: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  status: 'operational' | 'busy' | 'critical' | 'closed'
  capacity: {
    total: number
    available: number
    occupied: number
  }
  services: string[]
  waitTime: number
}

export type NotificationType = 'appointment' | 'message' | 'alert' | 'system'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  metadata?: {
    appointmentId?: string
    messageId?: string
    senderId?: string
    facilityId?: string
  }
}
