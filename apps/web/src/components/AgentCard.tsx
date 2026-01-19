import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusIndicator } from './StatusIndicator'
import { Clock, Lightning, Globe } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Agent, Language } from '@/lib/types'
import { motion } from 'framer-motion'

interface AgentCardProps {
  agent: Agent
  language: Language
  onClick?: () => void
}

export function AgentCard({ agent, language, onClick }: AgentCardProps) {
  const displayName = language === 'ar' && agent.name_ar ? agent.name_ar : agent.name
  const displayDescription = language === 'ar' && agent.description_ar ? agent.description_ar : agent.description

  const lastSeenText = agent.last_heartbeat
    ? formatTimestamp(agent.last_heartbeat)
    : language === 'ar' ? 'أبداً' : 'Never'

  const categoryColors: Record<string, string> = {
    healthcare: 'bg-success/10 text-success border-success/20',
    business: 'bg-accent/10 text-accent border-accent/20',
    automation: 'bg-purple/10 text-purple border-purple/20',
    content: 'bg-warning/10 text-warning border-warning/20',
    security: 'bg-destructive/10 text-destructive border-destructive/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-150 hover:shadow-lg hover:border-primary/30',
          language === 'ar' && 'text-right'
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold mb-1 truncate">
                {displayName}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <StatusIndicator status={agent.status} size="sm" />
                  <span className="text-xs text-muted-foreground capitalize">
                    {agent.status}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs border',
                    categoryColors[agent.category]
                  )}
                >
                  {agent.category}
                </Badge>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lightning size={14} weight="fill" />
                    <span className="font-medium">{agent.priority}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{language === 'ar' ? 'الأولوية' : 'Priority'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {displayDescription}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={14} />
            <span>{lastSeenText}</span>
          </div>

          <div className="pt-2 border-t border-border/50">
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">
                  {language === 'ar' ? 'القدرات' : 'Capabilities'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <TooltipProvider key={cap.name}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {cap.name}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{cap.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{agent.capabilities.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 pt-2">
            <Globe size={14} className="text-muted-foreground" />
            <div className="flex gap-1">
              {agent.languages.map((lang) => (
                <span key={lang} className="text-xs text-muted-foreground uppercase">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function formatTimestamp(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return `${diffDay}d ago`
}
