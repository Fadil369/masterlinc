import { useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FlowArrow, Play, Plus, Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Agent, Workflow, WorkflowStep, Language } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

interface WorkflowsViewProps {
  workflows: Workflow[]
  agents: Agent[]
  language: Language
  onCreateWorkflow: (workflow: Workflow) => void
  onRunWorkflow: (workflowId: string) => void
}

export function WorkflowsView({ workflows, agents, language, onCreateWorkflow, onRunWorkflow }: WorkflowsViewProps) {
  const t = useTranslation(language)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<Array<{
    agent_id: string
    action: string
    parametersText: string
    timeoutSec: number
  }>>([
    { agent_id: '', action: 'execute', parametersText: '{\n  "input": "..."\n}', timeoutSec: 30 }
  ])

  const agentOptions = useMemo(() => {
    return [...agents].sort((a, b) => a.priority - b.priority)
  }, [agents])

  const resetForm = () => {
    setName('')
    setDescription('')
    setSteps([{ agent_id: '', action: 'execute', parametersText: '{\n  "input": "..."\n}', timeoutSec: 30 }])
  }

  const addStep = () => {
    setSteps((prev) => [...prev, { agent_id: '', action: 'execute', parametersText: '{\n  "input": "..."\n}', timeoutSec: 30 }])
  }

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, patch: Partial<(typeof steps)[number]>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم سير العمل' : 'Please enter a workflow name')
      return
    }

    if (steps.length === 0) {
      toast.error(language === 'ar' ? 'يرجى إضافة خطوة واحدة على الأقل' : 'Please add at least one step')
      return
    }

    const workflowSteps: WorkflowStep[] = []
    for (const [idx, s] of steps.entries()) {
      if (!s.agent_id) {
        toast.error(language === 'ar'
          ? `يرجى اختيار وكيل للخطوة ${idx + 1}`
          : `Please select an agent for step ${idx + 1}`)
        return
      }

      let params: Record<string, unknown>
      try {
        params = JSON.parse(s.parametersText || '{}') as Record<string, unknown>
      } catch {
        toast.error(t.errors?.invalidJson ?? (language === 'ar' ? 'تنسيق JSON غير صالح' : 'Invalid JSON'))
        return
      }

      workflowSteps.push({
        step_id: uuidv4(),
        agent_id: s.agent_id,
        action: s.action || 'execute',
        parameters: params,
        timeout: Math.max(1, Math.floor(s.timeoutSec || 30))
      })
    }

    const workflow: Workflow = {
      workflow_id: uuidv4(),
      name: name.trim(),
      description: description.trim() || undefined,
      steps: workflowSteps,
      created_at: new Date().toISOString(),
      status: 'pending'
    }

    onCreateWorkflow(workflow)
    setIsDialogOpen(false)
    resetForm()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {language === 'ar'
            ? `${workflows.length} سير عمل`
            : `${workflows.length} workflows`}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={16} className={cn(language === 'ar' && 'ml-2', language === 'en' && 'mr-2')} />
              {t.workflows.createWorkflow}
            </Button>
          </DialogTrigger>
          <DialogContent className={cn('max-w-2xl', language === 'ar' && 'text-right')}>
            <DialogHeader>
              <DialogTitle>{t.workflows.createWorkflow}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.workflows.workflowName}</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.workflows.workflowDescription}</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t.workflows.steps}</div>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus size={16} className={cn(language === 'ar' && 'ml-2', language === 'en' && 'mr-2')} />
                  {t.workflows.addStep}
                </Button>
              </div>

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="border border-border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? `الخطوة ${index + 1}` : `Step ${index + 1}`}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(index)}
                        disabled={steps.length === 1}
                        aria-label={t.workflows.removeStep}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t.workflows.stepAgent}</label>
                        <Select value={step.agent_id} onValueChange={(v) => updateStep(index, { agent_id: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'ar' ? 'اختر وكيلاً' : 'Select agent'} />
                          </SelectTrigger>
                          <SelectContent>
                            {agentOptions
                              .filter((a) => a.agent_id !== 'masterlinc')
                              .map((a) => (
                                <SelectItem key={a.agent_id} value={a.agent_id}>
                                  {language === 'ar' && a.name_ar ? a.name_ar : a.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t.workflows.stepAction}</label>
                        <Input value={step.action} onChange={(e) => updateStep(index, { action: e.target.value })} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t.workflows.stepTimeout}</label>
                        <Input
                          type="number"
                          min={1}
                          value={step.timeoutSec}
                          onChange={(e) => updateStep(index, { timeoutSec: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t.workflows.stepParams}</label>
                      <Textarea
                        value={step.parametersText}
                        onChange={(e) => updateStep(index, { parametersText: e.target.value })}
                        rows={5}
                        className={cn('font-mono text-xs', language === 'ar' && 'text-right')}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.actions.cancel}
                </Button>
                <Button onClick={handleCreate}>
                  {t.actions.create}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              <Button onClick={() => setIsDialogOpen(true)}>
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {workflow.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRunWorkflow(workflow.workflow_id)}
                        disabled={workflow.status === 'running'}
                      >
                        <Play size={16} className={cn(language === 'ar' && 'ml-2', language === 'en' && 'mr-2')} />
                        {t.workflows.runWorkflow}
                      </Button>
                    </div>
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
