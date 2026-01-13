import { MetricCard } from '@/components/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from '@/components/StatusIndicator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartLine,
  Lightning,
  ChartLineUp,
  Broadcast,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react'
import type { Agent, Message, SystemHealth, Language, Workflow } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import { motion } from 'framer-motion'

interface DashboardViewProps {
  agents: Agent[]
  messages: Message[]
  workflows: Workflow[]
  systemHealth: SystemHealth
  language: Language
}

export function DashboardView({ agents, messages, workflows, systemHealth, language }: DashboardViewProps) {
  const t = useTranslation(language)

  const onlineAgents = agents.filter((a) => a.status === 'online').length
  const offlineAgents = agents.filter((a) => a.status === 'offline').length
  const totalMessages = messages.length
  const activeWorkflows = workflows.filter((w) => w.status === 'running').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t.dashboard.totalAgents}
          value={agents.length}
          icon={<Broadcast size={24} weight="fill" />}
          color="primary"
        />
        <MetricCard
          title={t.dashboard.onlineAgents}
          value={onlineAgents}
          icon={<CheckCircle size={24} weight="fill" />}
          color="success"
        />
        <MetricCard
          title={t.dashboard.messagesProcessed}
          value={totalMessages}
          icon={<Lightning size={24} weight="fill" />}
          color="accent"
        />
        <MetricCard
          title={t.dashboard.activeWorkflows}
          value={activeWorkflows}
          icon={<ChartLineUp size={24} weight="duotone" />}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartLine size={20} weight="duotone" />
              {t.dashboard.systemHealth}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIndicator
                  status={systemHealth.status === 'healthy' ? 'online' : 'degraded'}
                  size="lg"
                />
                <div>
                  <div className="font-semibold capitalize">{systemHealth.status}</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'حالة النظام' : 'System Status'}
                  </div>
                </div>
              </div>
              <Badge
                variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {systemHealth.status === 'healthy'
                  ? language === 'ar' ? 'تشغيلي' : 'Operational'
                  : language === 'ar' ? 'مشاكل' : 'Issues'}
              </Badge>
            </div>

            <div className="space-y-2">
              {systemHealth.services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <StatusIndicator
                      status={service.status === 'healthy' ? 'online' : 'offline'}
                      size="sm"
                      withPulse={false}
                    />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {service.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'وقت التشغيل' : 'Uptime'}
                </div>
                <div className="text-lg font-semibold">
                  {formatUptime(systemHealth.uptime)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الاتصالات النشطة' : 'Active Connections'}
                </div>
                <div className="text-lg font-semibold">{systemHealth.active_connections}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartLineUp size={20} weight="duotone" />
              {t.dashboard.recentActivity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Lightning size={32} className="text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'لا توجد رسائل حديثة' : 'No recent messages'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.slice(0, 10).map((message, index) => (
                    <motion.div
                      key={message.message_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Lightning size={14} weight="fill" className="text-accent flex-shrink-0" />
                          <div className="text-xs font-medium truncate">
                            <span className="font-mono">{message.sender_id}</span>
                            <span className="mx-1 text-muted-foreground">→</span>
                            <span className="font-mono">{message.receiver_id}</span>
                          </div>
                        </div>
                        <Badge
                          variant={message.status === 'delivered' ? 'default' : 'secondary'}
                          className="text-xs flex-shrink-0"
                        >
                          {message.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(message.timestamp, language)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.agentMetrics}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agents.slice(0, 5).map((agent) => (
              <div
                key={agent.agent_id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusIndicator status={agent.status} size="md" />
                  <div>
                    <div className="font-medium">
                      {language === 'ar' && agent.name_ar ? agent.name_ar : agent.name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{agent.agent_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-xs">
                    {agent.category}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {agent.last_heartbeat
                      ? formatTimestamp(agent.last_heartbeat, language)
                      : language === 'ar' ? 'أبداً' : 'Never'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatTimestamp(timestamp: string, language: Language): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  if (diffSec < 10) return language === 'ar' ? 'الآن' : 'just now'
  if (diffSec < 60) return `${diffSec}${language === 'ar' ? ' ثانية' : 's'}`
  if (diffMin < 60) return `${diffMin}${language === 'ar' ? ' دقيقة' : 'm'}`
  return `${diffHour}${language === 'ar' ? ' ساعة' : 'h'}`
}
