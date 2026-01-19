import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/useKV'
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
import { masterlincValidator } from '@/lib/validation/masterlinc-validator'
import { asToastText } from '@/lib/validation/errors'
import { masterlincAggregator } from '@/lib/aggregation'

function App() {
  const [language, setLanguage] = useKV<Language>('masterlinc-language', 'en')
  const [agents, setAgents] = useKV<Agent[]>('masterlinc-agents', mockAgents)
  const [messages, setMessages] = useKV<Message[]>('masterlinc-messages', mockMessages)
  const [workflows, setWorkflows] = useKV<Workflow[]>('masterlinc-workflows', [])
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

          const now = Date.now()
          const latencyMs = Math.floor(20 + Math.random() * 220)
          masterlincAggregator.ingestHeartbeat({
            agent_id: agent.agent_id,
            ts: now,
            latency_ms: latencyMs,
            status: agent.status
          })

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

  useEffect(() => {
    // keep a time-series of system health for aggregation
    masterlincAggregator.ingestSystemHealthFromModel(systemHealth, Date.now())
  }, [systemHealth])

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
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content) as Record<string, unknown>
    } catch {
      toast.error(currentLanguage === 'ar'
        ? 'تنسيق JSON غير صالح. يرجى تصحيح المحتوى والمحاولة مرة أخرى.'
        : 'Invalid JSON. Please fix the payload and try again.')
      return
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const newMessage: Message = {
      message_id: messageId,
      sender_id: senderId,
      receiver_id: receiverId,
      content_type: 'application/json',
      content: parsed,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }

    const validation = masterlincValidator.validate(newMessage, currentLanguage)
    if (!validation.ok) {
      toast.error(asToastText(validation, currentLanguage))
      return
    }

    setMessages((prevMessages) => [validation.data, ...(prevMessages ?? [])])

    // Simulate delivery acknowledgement (until real backend/WebSocket integration exists)
    setTimeout(() => {
      setMessages((prev) =>
        (prev ?? []).map((m) => (m.message_id === messageId ? { ...m, status: 'delivered' } : m))
      )
    }, 350)
  }

  const handleCreateWorkflow = (workflow: Workflow) => {
    setWorkflows((prev) => [workflow, ...(prev ?? [])])
    toast.success(currentLanguage === 'ar' ? 'تم إنشاء سير العمل' : 'Workflow created')
  }

  const handleRunWorkflow = (workflowId: string) => {
    const wf = (currentWorkflows ?? []).find((w) => w.workflow_id === workflowId)
    if (!wf) return

    // Signature for pattern tracking (sequence of agent ids)
    const stepSig = wf.steps.map((s) => s.agent_id).join('>')
    masterlincAggregator.ingestWorkflowEvent({ type: 'started', workflow: wf, stepAgentSignature: stepSig })

    setWorkflows((prev) =>
      (prev ?? []).map((w) => (w.workflow_id === workflowId ? { ...w, status: 'running' } : w))
    )

    // MASTERLINC executes steps by sending an execution command to each agent
    const orchestratorId = 'masterlinc'

    wf.steps.forEach((step, index) => {
      const delayMs = index * 900
      setTimeout(() => {
        const payload = {
          type: 'workflow_step_execute',
          workflow_id: wf.workflow_id,
          step_id: step.step_id,
          action: step.action,
          parameters: step.parameters,
          timeout_sec: step.timeout
        }

        const msgId = `msg_${Date.now()}_${index}_${Math.random().toString(16).slice(2)}`
        const msg: Message = {
          message_id: msgId,
          sender_id: orchestratorId,
          receiver_id: step.agent_id,
          content_type: 'application/json',
          content: payload,
          timestamp: new Date().toISOString(),
          status: 'pending'
        }

        const validation = masterlincValidator.validate(msg, currentLanguage)
        if (!validation.ok) {
          toast.error(asToastText(validation, currentLanguage))
          // do not enqueue invalid messages
          return
        }

        setMessages((prev) => [validation.data, ...(prev ?? [])])
        setTimeout(() => {
          setMessages((prev) =>
            (prev ?? []).map((m) => (m.message_id === msgId ? { ...m, status: 'delivered' } : m))
          )
        }, 400)
      }, delayMs)
    })

    const finishDelay = wf.steps.length * 900 + 450
    setTimeout(() => {
      setWorkflows((prev) =>
        (prev ?? []).map((w) => (w.workflow_id === workflowId ? { ...w, status: 'completed' } : w))
      )
      masterlincAggregator.ingestWorkflowEvent({ type: 'completed', workflow: wf, stepAgentSignature: stepSig })
      toast.success(currentLanguage === 'ar' ? 'اكتمل سير العمل' : 'Workflow completed')
    }, finishDelay)
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
              workflows={currentWorkflows}
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
            <WorkflowsView
              workflows={currentWorkflows}
              agents={currentAgents}
              language={currentLanguage}
              onCreateWorkflow={handleCreateWorkflow}
              onRunWorkflow={handleRunWorkflow}
            />
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