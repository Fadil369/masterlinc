import { useEffect, useMemo, useState } from 'react'
import { sbs, type ClaimCreateRequest } from '../../lib/sbs-client'
import { EnhancedCard } from '../ui/EnhancedCard'
import { AnimatedButton } from '../ui/AnimatedButton'

export function SBSClaims() {
  const [online, setOnline] = useState<boolean | null>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<ClaimCreateRequest>({
    patient_oid: '1.3.6.1.4.1.61026.3.1.patient-demo',
    provider_oid: '1.3.6.1.4.1.61026.3.2.provider-demo',
    facility_oid: '1.3.6.1.4.1.61026.3.3.facility-demo',
    diagnosis_code: 'Z00.0',
    services: [{ code: '99213', description: 'Outpatient visit', quantity: 1, unit_price: 250 }],
  })

  const total = useMemo(() => {
    const services = form.services || []
    return services.reduce((sum, s) => sum + (s.quantity || 0) * (s.unit_price || 0), 0)
  }, [form.services])

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const h = await sbs.health()
      setOnline(Boolean(h?.status))
      const list = await sbs.listClaims({ limit: '20' })
      setClaims(list?.claims || list || [])
      const st = await sbs.statistics()
      setStats(st)
    } catch (e: any) {
      setOnline(false)
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function create() {
    setLoading(true)
    setError(null)
    try {
      const res = await sbs.createClaim(form)
      await refresh()
      alert(`Claim created: ${res?.claim_id || res?.claimId || 'OK'}`)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function submit(claimId: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await sbs.submitToNphies(claimId)
      await refresh()
      alert(`Submitted: ${JSON.stringify(res)}`)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SBS Claims</h1>
          <p className="text-text-secondary">Claims creation, listing, NPHIES submission, statistics.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${online ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
            {online === null ? 'checking…' : online ? 'online' : 'offline'}
          </span>
          <AnimatedButton onClick={refresh} disabled={loading}>
            Refresh
          </AnimatedButton>
        </div>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnhancedCard title="Create Claim" description="Sends POST /api/claims/create">
          <div className="space-y-2">
            <label className="text-xs text-text-secondary">Patient OID</label>
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white" value={form.patient_oid}
              onChange={(e) => setForm((f) => ({ ...f, patient_oid: e.target.value }))} />

            <label className="text-xs text-text-secondary">Diagnosis Code</label>
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white" value={form.diagnosis_code || ''}
              onChange={(e) => setForm((f) => ({ ...f, diagnosis_code: e.target.value }))} />

            <div className="text-sm text-text-secondary">Total: <span className="text-white font-bold">{total}</span></div>

            <AnimatedButton onClick={create} disabled={loading || online === false}>
              Create Claim
            </AnimatedButton>
          </div>
        </EnhancedCard>

        <EnhancedCard title="Statistics" description="GET /api/statistics/claims">
          <pre className="text-xs text-text-secondary whitespace-pre-wrap">{JSON.stringify(stats, null, 2)}</pre>
        </EnhancedCard>
      </div>

      <EnhancedCard title="Latest Claims" description="GET /api/claims?limit=20">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-text-secondary">
                <th className="text-left p-2">Claim</th>
                <th className="text-left p-2">Patient</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(claims || []).map((c: any) => (
                <tr key={c.claim_id || c.claimId} className="border-t border-border/50">
                  <td className="p-2 text-white font-mono">{c.claim_id || c.claimId}</td>
                  <td className="p-2 text-text-secondary font-mono">{c.patient_oid || c.patientOid}</td>
                  <td className="p-2 text-text-secondary">{c.status || c.claim_status}</td>
                  <td className="p-2 text-right">
                    <AnimatedButton onClick={() => submit(c.claim_id || c.claimId)} disabled={loading || online === false}>
                      Submit
                    </AnimatedButton>
                  </td>
                </tr>
              ))}
              {(!claims || claims.length === 0) && (
                <tr><td className="p-2 text-text-secondary" colSpan={4}>No claims returned.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </EnhancedCard>
    </div>
  )
}
