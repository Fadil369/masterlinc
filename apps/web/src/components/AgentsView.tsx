import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AgentCard } from '@/components/AgentCard'
import { ArrowsClockwise, MagnifyingGlass } from '@phosphor-icons/react'
import type { Agent, AgentCategory, Language } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface AgentsViewProps {
  agents: Agent[]
  language: Language
  onRefresh: () => void
}

export function AgentsView({ agents, language, onRefresh }: AgentsViewProps) {
  const t = useTranslation(language)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AgentCategory | 'all'>('all')

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        searchQuery === '' ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.name_ar?.includes(searchQuery) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.agent_id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || agent.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [agents, searchQuery, categoryFilter])

  const sortedAgents = useMemo(() => {
    return [...filteredAgents].sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') return -1
      if (a.status !== 'online' && b.status === 'online') return 1
      return a.priority - b.priority
    })
  }, [filteredAgents])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full max-w-md">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-muted-foreground',
                language === 'ar' ? 'right-3' : 'left-3'
              )}
            />
            <Input
              type="text"
              placeholder={t.agents.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full',
                language === 'ar' ? 'pr-10 text-right' : 'pl-10'
              )}
            />
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as AgentCategory | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.agents.filterAll}</SelectItem>
              <SelectItem value="healthcare">{t.agents.filterHealthcare}</SelectItem>
              <SelectItem value="business">{t.agents.filterBusiness}</SelectItem>
              <SelectItem value="automation">{t.agents.filterAutomation}</SelectItem>
              <SelectItem value="content">{t.agents.filterContent}</SelectItem>
              <SelectItem value="security">{t.agents.filterSecurity}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onRefresh}>
            <ArrowsClockwise size={18} />
          </Button>
        </div>
      </div>

      {sortedAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <MagnifyingGlass size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {language === 'ar' ? 'لم يتم العثور على وكلاء' : 'No agents found'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {language === 'ar'
              ? 'جرب تغيير عوامل التصفية أو البحث الخاص بك'
              : 'Try changing your filters or search query'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAgents.map((agent) => (
            <AgentCard key={agent.agent_id} agent={agent} language={language} />
          ))}
        </div>
      )}

      <div className={cn(
        'text-sm text-muted-foreground',
        language === 'ar' && 'text-right'
      )}>
        {language === 'ar'
          ? `عرض ${sortedAgents.length} من ${agents.length} وكيل`
          : `Showing ${sortedAgents.length} of ${agents.length} agents`}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
