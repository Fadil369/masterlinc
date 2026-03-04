import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'https://brainsait-gateway.brainsait-fadil.workers.dev'
const AUTH_TOKEN = typeof localStorage !== 'undefined' ? (localStorage.getItem('brainsait_token') ?? '') : ''

function authFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${GATEWAY}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH_TOKEN}`, ...opts.headers },
  })
}

// ─── Resource type colours and icons ────────────────────────────────────────
const RESOURCE_META: Record<string, { label: string; icon: string; colour: string }> = {
  Patient:          { label: 'Patients',         icon: 'person',             colour: '#3b82f6' },
  ImagingStudy:     { label: 'Imaging Studies',   icon: 'radiology',          colour: '#8b5cf6' },
  DiagnosticReport: { label: 'Diagnostic Reports', icon: 'description',       colour: '#06b6d4' },
  Condition:        { label: 'Conditions',        icon: 'health_and_safety',  colour: '#f59e0b' },
  Claim:            { label: 'Claims',            icon: 'receipt_long',       colour: '#10b981' },
  ClaimResponse:    { label: 'Claim Responses',   icon: 'check_circle',       colour: '#22c55e' },
  Observation:      { label: 'Observations',      icon: 'monitor_heart',      colour: '#ef4444' },
  MedicationRequest:{ label: 'Medications',       icon: 'medication',         colour: '#f97316' },
}

type FHIRResource = Record<string, unknown>

interface ResourceCardProps {
  rtype: string
  resources: FHIRResource[]
  loading: boolean
  onSelect: (r: FHIRResource) => void
}

function ResourceCard({ rtype, resources, loading, onSelect }: ResourceCardProps) {
  const meta = RESOURCE_META[rtype] ?? { label: rtype, icon: 'folder', colour: '#6b7280' }
  return (
    <div className="bg-surface-dark-lighter rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[22px]" style={{ color: meta.colour }}>
          {meta.icon}
        </span>
        <span className="text-white font-semibold text-sm">{meta.label}</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono"
          style={{ background: meta.colour + '22', color: meta.colour }}>
          {loading ? '…' : resources.length}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-surface-dark animate-pulse" />
            ))
          : resources.length === 0
          ? <p className="text-text-secondary text-xs text-center py-2">No records found</p>
          : resources.map((r, i) => {
              const id = r.id as string ?? `item-${i}`
              const label = (() => {
                if (rtype === 'Patient') {
                  const n = (r.name as Array<{ family?: string; given?: string[] }>)?.[0]
                  return `${n?.given?.join(' ') ?? ''} ${n?.family ?? ''}`.trim() || id
                }
                if (rtype === 'ImagingStudy') return r.description as string || `Study ${id.slice(-6)}`
                if (rtype === 'DiagnosticReport') {
                  return (r.code as { coding?: Array<{ display?: string }> })?.coding?.[0]?.display || `Report ${id.slice(-6)}`
                }
                if (rtype === 'Condition') {
                  return (r.code as { coding?: Array<{ display?: string }> })?.coding?.[0]?.display || `Condition ${id.slice(-6)}`
                }
                if (rtype === 'Claim') return `Claim ${id.slice(-8)}`
                if (rtype === 'Observation') {
                  return (r.code as { coding?: Array<{ display?: string }> })?.coding?.[0]?.display || `Obs ${id.slice(-6)}`
                }
                return id.slice(-8)
              })()
              return (
                <button key={id} onClick={() => onSelect(r)}
                  className="text-left px-3 py-1.5 rounded-lg hover:bg-surface-dark text-text-secondary hover:text-white text-xs transition-colors truncate">
                  {label}
                </button>
              )
            })}
      </div>
    </div>
  )
}

function DetailPanel({ resource, onClose }: { resource: FHIRResource; onClose: () => void }) {
  const rtype = resource.resourceType as string
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-dark rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ color: RESOURCE_META[rtype]?.colour ?? '#6b7280' }}>
              {RESOURCE_META[rtype]?.icon ?? 'folder'}
            </span>
            <h3 className="text-white font-bold">{RESOURCE_META[rtype]?.label ?? rtype}</h3>
            <span className="text-xs text-text-secondary font-mono">{resource.id as string}</span>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <pre className="text-xs text-text-secondary bg-background-dark rounded-lg p-4 overflow-x-auto">
          {JSON.stringify(resource, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export function IRISDashboard() {
  const [health, setHealth] = useState<{ reachable?: boolean; fhirVersion?: string } | null>(null)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<string>('Patient')
  const [data, setData] = useState<Record<string, FHIRResource[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<FHIRResource | null>(null)
  const [irisStatus, setIrisStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')

  useEffect(() => {
    authFetch('/api/iris/health')
      .then(r => r.json())
      .then((d: { reachable?: boolean; fhirVersion?: string }) => {
        setHealth(d)
        setIrisStatus(d.reachable ? 'online' : 'offline')
      })
      .catch(() => setIrisStatus('offline'))
  }, [])

  const loadResource = useCallback(async (rtype: string, query?: string) => {
    setLoading(p => ({ ...p, [rtype]: true }))
    try {
      const params = new URLSearchParams()
      if (query) {
        if (rtype === 'Patient') params.set('name', query)
        else params.set('_text', query)
      }
      const resp = await authFetch(`/api/iris/fhir/${rtype}?${params}`)
      const bundle = await resp.json() as { entry?: Array<{ resource: FHIRResource }> }
      setData(p => ({ ...p, [rtype]: bundle.entry?.map(e => e.resource) ?? [] }))
    } catch {
      toast.error(`Failed to load ${rtype} from IRIS`)
    } finally {
      setLoading(p => ({ ...p, [rtype]: false }))
    }
  }, [])

  const loadAll = useCallback(() => {
    Object.keys(RESOURCE_META).forEach(t => loadResource(t, search || undefined))
  }, [loadResource, search])

  useEffect(() => { if (irisStatus === 'online') loadAll() }, [irisStatus])

  const totalResources = Object.values(data).reduce((s, a) => s + a.length, 0)

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      {selected && <DetailPanel resource={selected} onClose={() => setSelected(null)} />}

      {/* ─── Header ─── */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em]">
              IRIS for Health
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              InterSystems FHIR R4 Clinical Data Repository
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              irisStatus === 'online' ? 'bg-green-500/20 text-green-400' :
              irisStatus === 'offline' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                irisStatus === 'online' ? 'bg-green-400' :
                irisStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
              }`} />
              IRIS {irisStatus} {health?.fhirVersion ? `· FHIR ${health.fhirVersion}` : ''}
            </div>
            <button onClick={loadAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {/* ─── Stats row ─── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Records', value: totalResources, icon: 'database', colour: '#3b82f6' },
            { label: 'Patients', value: data.Patient?.length ?? 0, icon: 'person', colour: '#8b5cf6' },
            { label: 'Studies', value: data.ImagingStudy?.length ?? 0, icon: 'radiology', colour: '#06b6d4' },
            { label: 'Claims', value: data.Claim?.length ?? 0, icon: 'receipt_long', colour: '#10b981' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-dark-lighter rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[20px]" style={{ color: stat.colour }}>{stat.icon}</span>
                <span className="text-text-secondary text-xs">{stat.label}</span>
              </div>
              <p className="text-white text-2xl font-black">{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* ─── Search bar ─── */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadAll()}
              placeholder="Search patients, conditions, studies…"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-dark-lighter text-white rounded-xl border border-white/10 text-sm placeholder:text-text-secondary focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {Object.keys(RESOURCE_META).map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeType === t ? 'text-white' : 'text-text-secondary hover:text-white'
                }`}
                style={activeType === t ? { background: RESOURCE_META[t].colour + '33', color: RESOURCE_META[t].colour } : {}}>
                {RESOURCE_META[t].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Resource grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.keys(RESOURCE_META).map(rtype => (
            <ResourceCard key={rtype} rtype={rtype}
              resources={data[rtype] ?? []}
              loading={loading[rtype] ?? false}
              onSelect={setSelected} />
          ))}
        </div>
      </div>
    </div>
  )
}
