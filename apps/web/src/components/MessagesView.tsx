import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Lightning, PaperPlaneRight, Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Message, Agent, Language } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface MessagesViewProps {
  messages: Message[]
  agents: Agent[]
  language: Language
  onSendMessage: (senderId: string, receiverId: string, content: string) => void
  onClearMessages: () => void
}

export function MessagesView({ messages, agents, language, onSendMessage, onClearMessages }: MessagesViewProps) {
  const t = useTranslation(language)
  const [senderId, setSenderId] = useState('')
  const [receiverId, setReceiverId] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSendMessage = () => {
    if (!senderId || !receiverId || !messageContent.trim()) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields')
      return
    }

    if (senderId === receiverId) {
      toast.error(language === 'ar' ? 'لا يمكن إرسال رسالة إلى نفس الوكيل' : 'Cannot send message to same agent')
      return
    }

    onSendMessage(senderId, receiverId, messageContent)
    setMessageContent('')
    setIsDialogOpen(false)
    toast.success(language === 'ar' ? 'تم إرسال الرسالة' : 'Message sent')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {language === 'ar'
            ? `${messages.length} رسالة`
            : `${messages.length} messages`}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearMessages}
            disabled={messages.length === 0}
          >
            <Trash size={16} className={cn(language === 'ar' && 'ml-2', language === 'en' && 'mr-2')} />
            {t.messages.clearLog}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PaperPlaneRight size={16} className={cn(language === 'ar' && 'ml-2', language === 'en' && 'mr-2')} />
                {t.messages.sendMessage}
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(language === 'ar' && 'text-right')}>
              <DialogHeader>
                <DialogTitle>{t.messages.sendMessage}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.messages.from}</label>
                  <Select value={senderId} onValueChange={setSenderId}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر الوكيل المرسل' : 'Select sender agent'} />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                          {language === 'ar' && agent.name_ar ? agent.name_ar : agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.messages.to}</label>
                  <Select value={receiverId} onValueChange={setReceiverId}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر الوكيل المستلم' : 'Select receiver agent'} />
                    </SelectTrigger>
                    <SelectContent>
                      {agents
                        .filter((agent) => agent.agent_id !== senderId)
                        .map((agent) => (
                          <SelectItem key={agent.agent_id} value={agent.agent_id}>
                            {language === 'ar' && agent.name_ar ? agent.name_ar : agent.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.messages.content}</label>
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                    rows={4}
                    className={cn(language === 'ar' && 'text-right')}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t.actions.cancel}
                  </Button>
                  <Button onClick={handleSendMessage}>
                    <PaperPlaneRight size={16} className={cn(language === 'ar' && 'ml-2', language === 'en' && 'mr-2')} />
                    {t.actions.send}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightning size={20} weight="duotone" />
            {t.messages.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Lightning size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t.messages.noMessages}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? 'ابدأ بإرسال رسالة بين الوكلاء'
                    : 'Start by sending a message between agents'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.message_id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Lightning size={16} weight="fill" className="text-accent flex-shrink-0" />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-medium">{message.sender_id}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-mono text-sm font-medium">{message.receiver_id}</span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            message.status === 'delivered'
                              ? 'default'
                              : message.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="flex-shrink-0"
                        >
                          {message.status}
                        </Badge>
                      </div>

                      <div className="bg-muted/50 rounded p-3 mb-2">
                        <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(message.content, null, 2)}
                        </pre>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatTimestamp(message.timestamp, language)}</span>
                        <span className="font-mono">{message.message_id}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function formatTimestamp(timestamp: string, language: Language): string {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}
