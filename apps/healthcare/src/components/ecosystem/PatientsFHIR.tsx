import { useMemo, useState } from 'react'
import { fhir, type FhirPatient } from '../../lib/fhir-client'
import { audit } from '../../lib/audit-client'
import { toast } from 'sonner'

function patientDisplayName(p: FhirPatient): string {
  const name = p.name?.[0]
  const given = name?.given?.join(' ') || ''
  const family = name?.family || ''
  const full = `${given} ${family}`.trim()
  return full || p.id || 'Unnamed Patient'
}

export function PatientsFHIR() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<FhirPatient[]>([])

  const canCreate = useMemo(() => true, [])

  const load = async () => {
    setLoading(true)
    try {
      const bundle = await fhir.searchPatients(query ? { name: query } : undefined)
      const list = bundle.entry?.map(e => e.resource) || []
      setPatients(list)
      toast.success(`Loaded ${list.length} patients`)

      // Log audit event (best effort)
      audit.log({
        actorId: 'demo-user',
        actorRole: 'admin',
        action: 'FHIR_PATIENT_SEARCH',
        resourceType: 'Patient',
        resourceId: '*',
        metadata: { query },
      }).catch(() => {})
    } catch (e: any) {
      toast.error('Failed to load patients')
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const createDemoPatient = async () => {
    if (!canCreate) return

    setLoading(true)
    try {
      const created = await fhir.createPatient({
        resourceType: 'Patient',
        active: true,
        name: [{ given: ['Demo'], family: `Patient ${Math.floor(Math.random() * 1000)}` }],
        gender: 'unknown',
      })

      toast.success(`Created ${patientDisplayName(created)}`)

      audit.log({
        actorId: 'demo-user',
        actorRole: 'admin',
        action: 'FHIR_PATIENT_CREATE',
        resourceType: 'Patient',
        resourceId: created.id || 'unknown',
        patientId: created.id,
      }).catch(() => {})

      await load()
    } catch (e: any) {
      toast.error('Failed to create patient')
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white text-2xl font-black">FHIR Patients</h2>
          <p className="text-text-secondary text-sm">Live data from FHIR Server</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={createDemoPatient}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60"
          >
            Create Demo Patient
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-surface-dark-lighter text-white font-semibold disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name (FHIR search)…"
          className="flex-1 h-11 rounded-xl bg-surface-dark-lighter border border-border px-4 text-white"
        />
        <button
          onClick={load}
          disabled={loading}
          className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-60"
        >
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patients.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-surface-dark p-4">
            <div className="flex items-center justify-between">
              <div className="text-white font-bold">{patientDisplayName(p)}</div>
              <div className="text-xs text-text-secondary">{p.id}</div>
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              {p.gender || 'unknown'} {p.birthDate ? `• ${p.birthDate}` : ''}
            </div>
          </div>
        ))}
        {patients.length === 0 && (
          <div className="text-text-secondary text-sm">No patients loaded yet.</div>
        )}
      </div>
    </div>
  )
}
