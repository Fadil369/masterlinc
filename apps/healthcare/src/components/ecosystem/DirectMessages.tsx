import { useState, useEffect } from 'react'
import { Conversation, Message } from '../../types'
import { useNotificationContext } from '../../contexts/NotificationContext'

const mockConversations: Conversation[] = [
  {
    id: '1',
    participantId: 'D-001',
    participantName: 'Dr. Ahmad Al-Rashid',
    participantAvatar: 'https://picsum.photos/100/100',
    participantRole: 'Cardiologist',
    lastMessage: 'Patient labs came back normal',
    lastMessageTime: '2 min ago',
    unreadCount: 2
  },
  {
    id: '2',
    participantId: 'P-001',
    participantName: 'Sarah Al-Qahtani',
    participantAvatar: 'https://picsum.photos/101/101',
    participantRole: 'Patient',
    lastMessage: 'Thank you for the follow-up',
    lastMessageTime: '1 hour ago',
    unreadCount: 0
  },
  {
    id: '3',
    participantId: 'D-002',
    participantName: 'Dr. Fatima Al-Zahrani',
    participantAvatar: 'https://picsum.photos/102/102',
    participantRole: 'Neurologist',
    lastMessage: 'Can you review this case?',
    lastMessageTime: '3 hours ago',
    unreadCount: 1
  }
]

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'D-001',
    senderName: 'Dr. Ahmad Al-Rashid',
    senderAvatar: 'https://picsum.photos/100/100',
    recipientId: 'current-user',
    content: 'Patient labs came back normal',
    timestamp: '10:30 AM',
    read: false
  },
  {
    id: '2',
    senderId: 'current-user',
    senderName: 'You',
    senderAvatar: 'https://picsum.photos/103/103',
    recipientId: 'D-001',
    content: 'Great, thanks for letting me know. Should we schedule the follow-up?',
    timestamp: '10:28 AM',
    read: true
  }
]

export function DirectMessages() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1')
  const [messageInput, setMessageInput] = useState('')
  const { addNotification } = useNotificationContext()

  const handleSend = () => {
    if (!messageInput.trim() || !selectedConversation) return

    const conversation = conversations?.find(c => c.id === selectedConversation)
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: 'https://picsum.photos/103/103',
      recipientId: selectedConversation,
      content: messageInput,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      read: false
    }

    setMessages((current) => [...(current || []), newMessage])
    
    setConversations((current) =>
      (current || []).map((conv) =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: messageInput, lastMessageTime: 'Just now' }
          : conv
      )
    )
    
    setMessageInput('')
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
    
    const conversation = conversations?.find(c => c.id === conversationId)
    if (conversation && conversation.unreadCount > 0) {
      setConversations((current) =>
        (current || []).map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      )
      
      setMessages((current) =>
        (current || []).map((msg) =>
          msg.recipientId === 'current-user' && msg.senderId === conversation.participantId
            ? { ...msg, read: true }
            : msg
        )
      )
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random()
      if (random < 0.3) {
        const randomConversation = conversations?.[Math.floor(Math.random() * (conversations?.length || 0))]
        
        if (randomConversation && randomConversation.id !== selectedConversation) {
          const messages = [
            'Quick update on the patient.',
            'Could you review this file?',
            'Appointment reminder for tomorrow.',
            'Lab results are ready.',
            'Please confirm the prescription.',
            'Patient is asking about follow-up.'
          ]
          
          const randomMessage = messages[Math.floor(Math.random() * messages.length)]
          
          const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: randomConversation.participantId,
            senderName: randomConversation.participantName,
            senderAvatar: randomConversation.participantAvatar,
            recipientId: 'current-user',
            content: randomMessage,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            read: false
          }
          
          setMessages((current) => [...(current || []), newMessage])
          
          setConversations((current) =>
            (current || []).map((conv) =>
              conv.id === randomConversation.id
                ? {
                    ...conv,
                    lastMessage: randomMessage,
                    lastMessageTime: 'Just now',
                    unreadCount: conv.unreadCount + 1
                  }
                : conv
            )
          )
          
          addNotification(
            'message',
            'medium',
            `New message from ${randomConversation.participantName}`,
            randomMessage,
            {
              messageId: newMessage.id,
              senderId: randomConversation.participantId
            }
          )
        }
      }
    }, 15000)
    
    return () => clearInterval(interval)
  }, [conversations, selectedConversation, addNotification, setMessages, setConversations])

  return (
    <div className="h-full bg-background-dark flex">
      <div className="w-96 bg-surface-dark border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-white font-bold text-xl mb-4">Messages</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations && conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation.id)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-surface-dark-lighter transition-colors border-b border-border ${
                selectedConversation === conversation.id ? 'bg-surface-dark-lighter' : ''
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={conversation.participantAvatar}
                  alt={conversation.participantName}
                  className="w-12 h-12 rounded-full"
                />
                {conversation.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-bold">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-bold text-sm truncate">
                    {conversation.participantName}
                  </h3>
                  <span className="text-text-secondary text-xs shrink-0 ml-2">
                    {conversation.lastMessageTime}
                  </span>
                </div>
                <p className="text-text-secondary text-xs mb-1">{conversation.participantRole}</p>
                <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-white font-medium' : 'text-text-secondary'}`}>
                  {conversation.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 bg-surface-dark border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={conversations?.find(c => c.id === selectedConversation)?.participantAvatar}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="text-white font-bold text-base">
                    {conversations?.find(c => c.id === selectedConversation)?.participantName}
                  </h3>
                  <p className="text-text-secondary text-xs">
                    {conversations?.find(c => c.id === selectedConversation)?.participantRole}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 bg-surface-dark-lighter hover:bg-muted text-white rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                </button>
                <button className="p-2 bg-surface-dark-lighter hover:bg-muted text-white rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </button>
                <button className="p-2 bg-surface-dark-lighter hover:bg-muted text-white rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages && messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.senderId === 'current-user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={message.senderAvatar}
                    alt={message.senderName}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                  <div className={`max-w-[70%] ${message.senderId === 'current-user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`p-3 rounded-lg ${
                      message.senderId === 'current-user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-dark-lighter text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-text-secondary text-xs mt-1">{message.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-surface-dark border-t border-border">
              <div className="flex items-end gap-3">
                <button className="p-2 bg-surface-dark-lighter hover:bg-muted text-white rounded-lg transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Type your message..."
                  rows={3}
                  className="flex-1 px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm resize-none"
                />
                
                <button
                  onClick={handleSend}
                  className="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-text-secondary text-[64px] mb-4">
                chat
              </span>
              <p className="text-text-secondary">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
