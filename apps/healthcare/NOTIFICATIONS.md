# Notification System Integration

## Overview
The notification system is fully integrated with the Appointments and Messages modules, providing real-time alerts for important events across the BrainSAIT healthcare ecosystem.

## Features

### 1. **Appointment Notifications**
- **New Appointment Scheduled**: Triggered when a new appointment is booked
- **Appointment Status Changes**: Notifies when appointments are completed, cancelled, or marked as no-show
- **Appointment Reminders**: Automatic reminders at 30 minutes and 15 minutes before scheduled appointments
- **Appointment Deleted**: Confirmation when an appointment is removed

### 2. **Message Notifications**
- **New Message Received**: Real-time notifications when new messages arrive from providers, staff, or patients
- **Unread Message Count**: Visual badges on the Messages tab showing unread message counts
- **Auto-generated Messages**: Simulated message notifications every 15 seconds for demo purposes

### 3. **Notification Center**
- **Centralized Panel**: Slide-out panel displaying all notifications
- **Unread Count Badge**: Visual indicator on the bell icon showing total unread notifications
- **Priority-based Styling**: Different colors and styles based on notification priority (low, medium, high, critical)
- **Interactive Actions**:
  - Click notifications to navigate to relevant module
  - Mark individual notifications as read
  - Mark all as read
  - Delete individual notifications
  - Clear all notifications

### 4. **Toast Notifications**
- **Immediate Feedback**: Pop-up toasts for real-time event notifications
- **Priority-based Durations**: Critical alerts stay visible longer
- **Colored Borders**: Visual differentiation based on notification type and priority

### 5. **Visual Badges**
- **Navigation Bar Badges**: Appointment and Message tabs show unread counts
- **Conversation List**: Individual conversation items display unread message counts
- **Real-time Updates**: Badges update automatically as notifications arrive

## Architecture

### NotificationContext
- Global state management for notifications across the application
- Provides hooks for adding, reading, and managing notifications
- Ensures consistent notification behavior throughout all modules

### useNotificationContext Hook
Used in components to access notification functionality:
```typescript
const { addNotification, notifications, unreadCount } = useNotificationContext()
```

### Notification Types
- `appointment`: Calendar/scheduling related
- `message`: Direct messaging related  
- `alert`: Critical facility or system alerts
- `system`: General system notifications

### Priority Levels
- `low`: General information (5s duration)
- `medium`: Standard notifications (5s duration)
- `high`: Important updates (7s duration)
- `critical`: Urgent alerts (10s duration)

## Usage Examples

### Triggering an Appointment Notification
```typescript
addNotification(
  'appointment',
  'high',
  'Appointment Reminder',
  'Patient John Doe has an appointment in 15 minutes',
  { appointmentId: 'apt-123' }
)
```

### Triggering a Message Notification
```typescript
addNotification(
  'message',
  'medium',
  'New Message',
  'Dr. Sarah: Patient labs are ready',
  { messageId: 'msg-456', senderId: 'D-001' }
)
```

## Navigation Integration
Clicking on a notification automatically:
1. Marks the notification as read
2. Navigates to the relevant module (Appointments or Messages)
3. Closes the notification panel
4. Provides context for the specific item (future enhancement)

## Data Persistence
All notifications are persisted using the `useKV` hook, ensuring:
- Notifications survive page refreshes
- Read/unread states are maintained
- Notification history is preserved

## Demo Features
The Notification Demo button (bottom-right corner) allows testing:
- Random appointment notifications
- Random message notifications
- Alert notifications
- System notifications

## Future Enhancements
- Deep linking to specific appointments/messages
- Notification preferences and filtering
- Sound alerts for critical notifications
- Push notification support
- Notification scheduling and snoozing
- Category-based notification management
