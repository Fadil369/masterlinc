import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Toaster } from '@/components/ui/sonner'
import { DashboardView } from '@/components/DashboardView'
import { AgentsView } from '@/components/AgentsView'
import { MessagesView } from '@/components/MessagesView'
import { WorkflowsView } from '@/components/WorkflowsView'
import { Globe, ArrowsClockwise } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { mockAgents, mockMessages, mockSystemHealth } from '@/lib/mock-data'
import { useTranslation } from '@/lib/i18n'
import type { Language, Agent, Message, SystemHealth, Workflow } from '@/lib/types'
import { toast } from 'sonner'

function App() {
  const [language, setLanguage] = useKV<Language>('masterlinc-language', 'en')
  const [agents, setAgents] = useKV<Agent[]>('masterlinc-agents', mockAgents)
  const [messages, setMessages] = useKV<Message[]>('masterlinc-messages', mockMessages)
  const [workflows] = useKV<Workflow[]>('masterlinc-workflows', [])
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(mockSystemHealth)
  const [activeTab, setActiveTab] = useState('dashboard')

  const currentLanguage = language ?? 'en'
  const currentAgents = agents ?? []
  const currentMessages = messages ?? []
  const currentWorkflows = workflows ?? []
  const t = useTranslation(currentLanguage)

  useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = currentLanguage
  }, [currentLanguage])

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prevAgents) => {
        if (!prevAgents) return mockAgents
        return prevAgents.map((agent) => {
          const shouldUpdate = Math.random() > 0.7
          if (!shouldUpdate) return agent

          return {
            ...agent,
            last_heartbeat: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })
      })

      setSystemHealth((current) => ({
        ...current,
        timestamp: new Date().toISOString(),
        uptime: current.uptime + 10
      }))
    }, 10000)

    return () => clearInterval(interval)
  }, [setAgents])

  const toggleLanguage = () => {
    setLanguage((currentLang) => (currentLang === 'ar' ? 'en' : 'ar'))
  }

  const handleRefreshAgents = () => {
    setAgents((prevAgents) => {
      if (!prevAgents) return mockAgents
      return prevAgents.map((agent) => ({
        ...agent,
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    })
    toast.success(currentLanguage === 'ar' ? 'تم تحديث الوكلاء' : 'Agents refreshed')
  }

  const handleSendMessage = (senderId: string, receiverId: string, content: string) => {
    const newMessage: Message = {
      message_id: `msg_${Date.now()}`,
      sender_id: senderId,
      receiver_id: receiverId,
      content_type: 'application/json',
      content: JSON.parse(content),
      timestamp: new Date().toISOString(),
      status: 'delivered'
    }

    setMessages((prevMessages) => [newMessage, ...(prevMessages ?? [])])
  }

  const handleClearMessages = () => {
    setMessages([])
    toast.success(currentLanguage === 'ar' ? 'تم مسح الرسائل' : 'Messages cleared')
  }

  return (
    <div className={cn('min-h-screen bg-background', currentLanguage === 'ar' && 'font-arabic')}>
      <Toaster position={currentLanguage === 'ar' ? 'top-left' : 'top-right'} />
      
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              M
            </div>
            <div className={cn(currentLanguage === 'ar' && 'text-right')}>
              <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-xs text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshAgents}
              className="relative"
            >
              <ArrowsClockwise size={18} />
            </Button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">EN</span>
              <Switch
                checked={currentLanguage === 'ar'}
                onCheckedChange={toggleLanguage}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-sm font-medium">AR</span>
              <Globe size={16} className="ml-1 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">{t.tabs.dashboard}</TabsTrigger>
            <TabsTrigger value="agents">{t.tabs.agents}</TabsTrigger>
            <TabsTrigger value="messages">{t.tabs.messages}</TabsTrigger>
            <TabsTrigger value="workflows">{t.tabs.workflows}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <DashboardView
              agents={currentAgents}
              messages={currentMessages}
              systemHealth={systemHealth}
              language={currentLanguage}
            />
          </TabsContent>

          <TabsContent value="agents" className="mt-0">
            <AgentsView
              agents={currentAgents}
              language={currentLanguage}
              onRefresh={handleRefreshAgents}
            />
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <MessagesView
              messages={currentMessages}
              agents={currentAgents}
              language={currentLanguage}
              onSendMessage={handleSendMessage}
              onClearMessages={handleClearMessages}
            />
          </TabsContent>

          <TabsContent value="workflows" className="mt-0">
            <WorkflowsView workflows={currentWorkflows} language={currentLanguage} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border/40 mt-12">
        <div className="container px-4 sm:px-6 py-6">
          <div className={cn(
            'flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground',
            currentLanguage === 'ar' && 'text-right'
          )}>
            <div>
              {currentLanguage === 'ar'
                ? 'ماسترلينك - نظام تنسيق وكلاء برينسايت لينك'
                : 'MASTERLINC - BrainSAIT LINC Agent Orchestration System'}
            </div>
            <div className="flex items-center gap-4">
              <span>
                {currentLanguage === 'ar'
                  ? `${currentAgents.length} وكلاء مسجلين`
                  : `${currentAgents.length} Agents Registered`}
              </span>
              <span>•</span>
              <span>
                {currentLanguage === 'ar'
                  ? `${currentMessages.length} رسائل معالجة`
                  : `${currentMessages.length} Messages Processed`}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App