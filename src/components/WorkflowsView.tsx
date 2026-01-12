import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlowArrow, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Workflow, Language } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface WorkflowsViewProps {
  workflows: Workflow[]
  language: Language
}

export function WorkflowsView({ workflows, language }: WorkflowsViewProps) {
  const t = useTranslation(language)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {language === 'ar'
            ? `${workflows.length} سير عمل`
            : `${workflows.length} workflows`}
        </div>
        <Button size="sm">
          <Plus size={16} className={cn(language === 'ar' && 'ml-2', language === 'en' && 'mr-2')} />
          {t.workflows.createWorkflow}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlowArrow size={20} weight="duotone" />
            {t.workflows.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FlowArrow size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t.workflows.noWorkflows}</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {language === 'ar'
                  ? 'قم بإنشاء سير عمل لتنسيق الإجراءات عبر وكلاء متعددة'
                  : 'Create a workflow to orchestrate actions across multiple agents'}
              </p>
              <Button>
                <Plus size={16} className={cn(language === 'ar' && 'ml-2', language === 'en' && 'mr-2')} />
                {t.workflows.createWorkflow}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.workflow_id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{workflow.name}</h4>
                    <span className="text-xs text-muted-foreground">{workflow.status}</span>
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {workflow.steps.length} {language === 'ar' ? 'خطوات' : 'steps'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
