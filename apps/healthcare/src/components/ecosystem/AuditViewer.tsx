import { useState } from 'react'
import { audit } from '../../lib/audit-client'
import { toast } from 'sonner'

export function AuditViewer() {
  const [actorId, setActorId] = useState('demo-user')
  const [patientId, setPatientId] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const search = async () => {
    setLoading(true)
    try {
      const res = await audit.search({ actorId: actorId || undefined, patientId: patientId || undefined, resourceType: resourceType || undefined })
      setResult(res)
      toast.success('Audit logs loaded')
    } catch (e: any) {
      toast.error('Failed to load audit logs')
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-white text-2xl font-black">Audit Logs</h2>
        <p className="text-text-secondary text-sm">Search HIPAA audit events from Audit Logger</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Actor ID</label>
          <input value={actorId} onChange={(e) => setActorId(e.target.value)} className="w-full h-11 rounded-xl bg-surface-dark-lighter border border-border px-4 text-white" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Patient ID</label>
          <input value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full h-11 rounded-xl bg-surface-dark-lighter border border-border px-4 text-white" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Resource Type</label>
          <input value={resourceType} onChange={(e) => setResourceType(e.target.value)} className="w-full h-11 rounded-xl bg-surface-dark-lighter border border-border px-4 text-white" placeholder="Patient / PaymentIntent …" />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={search} disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60">
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface-dark p-4">
        <div className="text-white font-bold mb-2">Response</div>
        <pre className="text-xs text-text-secondary overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  )
}
