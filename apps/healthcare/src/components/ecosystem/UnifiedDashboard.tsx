import { useState, useEffect } from 'react'
import { toast } from 'sonner'

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'https://brainsait-gateway.brainsait-fadil.workers.dev'
const AUTH_TOKEN = typeof localStorage !== 'undefined' ? (localStorage.getItem('brainsait_token') ?? '') : ''

function authFetch(path: string) {
  return fetch(`${GATEWAY}${path}`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}`, 'Content-Type': 'application/json' },
  })
}

interface ServiceStatus { ok: boolean; status?: number; error?: string }
interface ActivityLog { id: string; action: string; service: string; ts: number; http_status?: number }
interface Analytics { service: string; requests: number; errors: number; p50: number; p95: number }

function ServiceTile({ name, status, icon, colour }: {
  name: string; status: ServiceStatus | null; icon: string; colour: string
}) {
  const isOnline = status?.ok
  return (
    <div className="bg-surface-dark-lighter rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colour + '22' }}>
            <span className="material-symbols-outlined text-[22px]" style={{ color: colour }}>{icon}</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{name}</p>
            <p className="text-text-secondary text-xs">
              {status === null ? 'Checking…' : `HTTP ${status.status ?? '?'}`}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          status === null ? 'bg-yellow-500/20 text-yellow-400' :
          isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            status === null ? 'bg-yellow-400 animate-pulse' :
            isOnline ? 'bg-green-400' : 'bg-red-400'
          }`} />
          {status === null ? 'Checking' : isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  )
}

function MiniChart({ data, colour }: { data: number[]; colour: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm opacity-80 transition-all"
          style={{ height: `${(v / max) * 100}%`, background: colour }} />
      ))}
    </div>
  )
}

export function UnifiedDashboard() {
  const [services, setServices] = useState<Record<string, ServiceStatus | null>>({
    masterlinc: null, sbs: null, iris: null, rag: null,
  })
  const [overall, setOverall] = useState<'healthy' | 'degraded' | 'unknown'>('unknown')
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([])
  const [analytics, setAnalytics] = useState<Analytics[]>([])
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const checkHealth = async () => {
    setRefreshing(true)
    try {
      const resp = await authFetch('/health/services')
      const d = await resp.json() as { overall: string; services: Record<string, ServiceStatus> }
      setServices(d.services)
      setOverall(d.overall as 'healthy' | 'degraded')
      setLastChecked(new Date())
    } catch { setOverall('degraded') }
    finally { setRefreshing(false) }
  }

  const loadAudit = async () => {
    try {
      const r = await authFetch('/api/audit?limit=20')
      const d = await r.json() as { logs: ActivityLog[] }
      setAuditLogs(d.logs ?? [])
    } catch {}
  }

  const loadAnalytics = async () => {
    try {
      const r = await authFetch('/api/analytics?hours=24')
      const d = await r.json() as { services: Analytics[] }
      setAnalytics(d.services ?? [])
    } catch {}
  }

  useEffect(() => {
    checkHealth()
    loadAudit()
    loadAnalytics()
    const interval = setInterval(() => { checkHealth(); loadAudit() }, 30_000)
    return () => clearInterval(interval)
  }, [])

  const serviceConfig = [
    { key: 'masterlinc', name: 'MasterLinc Orchestrator', icon: 'hub', colour: '#3b82f6' },
    { key: 'sbs',        name: 'SBS / NPHIES Bridge',     icon: 'receipt_long', colour: '#10b981' },
    { key: 'iris',       name: 'IRIS for Health (FHIR)',  icon: 'local_hospital', colour: '#8b5cf6' },
    { key: 'rag',        name: 'Ultimate RAG System',     icon: 'psychiatry', colour: '#f59e0b' },
  ]

  const totalRequests = analytics.reduce((s, a) => s + (a.requests ?? 0), 0)
  const totalErrors   = analytics.reduce((s, a) => s + (a.errors ?? 0), 0)
  const errorRate     = totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(1) : '0.0'

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em]">
              Unified Dashboard
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              BrainSAIT Platform · All Services · Real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastChecked && (
              <span className="text-xs text-text-secondary">Updated {lastChecked.toLocaleTimeString()}</span>
            )}
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 ${
              overall === 'healthy'  ? 'bg-green-500/20 text-green-300' :
              overall === 'degraded' ? 'bg-red-500/20 text-red-300' :
              'bg-yellow-500/20 text-yellow-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                overall === 'healthy' ? 'bg-green-400' :
                overall === 'degraded' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
              }`} />
              {overall === 'healthy' ? 'All Systems Go' : overall === 'degraded' ? 'Degraded' : 'Checking…'}
            </div>
            <button onClick={checkHealth} disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {/* ─── Summary metrics ─── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Requests (24h)', value: totalRequests.toLocaleString(), icon: 'http', colour: '#3b82f6' },
            { label: 'Error Rate', value: `${errorRate}%`, icon: 'error', colour: totalErrors > 0 ? '#ef4444' : '#10b981' },
            { label: 'Services Online', value: `${Object.values(services).filter(s => s?.ok).length}/4`, icon: 'cloud_done', colour: '#10b981' },
            { label: 'Audit Events (24h)', value: auditLogs.length.toLocaleString(), icon: 'history', colour: '#f59e0b' },
          ].map(metric => (
            <div key={metric.label} className="bg-surface-dark-lighter rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[20px]" style={{ color: metric.colour }}>{metric.icon}</span>
                <span className="text-text-secondary text-xs">{metric.label}</span>
              </div>
              <p className="text-white text-2xl font-black">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* ─── Service tiles ─── */}
        <div>
          <h2 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-400">monitor_heart</span>
            Service Health
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {serviceConfig.map(cfg => (
              <ServiceTile key={cfg.key} name={cfg.name} status={services[cfg.key] ?? null}
                icon={cfg.icon} colour={cfg.colour} />
            ))}
          </div>
        </div>

        {/* ─── Analytics + Audit side by side ─── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Analytics */}
          <div className="bg-surface-dark-lighter rounded-2xl p-5">
            <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-purple-400">bar_chart</span>
              24h Traffic by Service
            </h3>
            {analytics.length === 0
              ? <p className="text-text-secondary text-xs text-center py-4">No analytics data yet</p>
              : (
                <div className="flex flex-col gap-3">
                  {analytics.map(a => (
                    <div key={a.service} className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary w-24 truncate">{a.service}</span>
                      <div className="flex-1">
                        <MiniChart
                          data={[a.requests ?? 0, a.errors ?? 0]}
                          colour={a.errors > 0 ? '#ef4444' : '#3b82f6'} />
                      </div>
                      <span className="text-xs text-white w-12 text-right">{a.requests?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Audit log */}
          <div className="bg-surface-dark-lighter rounded-2xl p-5">
            <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-yellow-400">history</span>
              Recent Activity
            </h3>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {auditLogs.length === 0
                ? <p className="text-text-secondary text-xs text-center py-4">No activity logged yet</p>
                : auditLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-background-dark">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      (log.http_status ?? 200) >= 500 ? 'bg-red-400' :
                      (log.http_status ?? 200) >= 400 ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-xs text-text-secondary font-mono w-16 truncate">{log.service}</span>
                    <span className="text-xs text-white flex-1 truncate">{log.action}</span>
                    <span className="text-[10px] text-text-secondary flex-shrink-0">
                      {new Date((log.ts ?? 0)).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ─── Cloudflare Resources Status ─── */}
        <div className="bg-surface-dark-lighter rounded-2xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-orange-400">cloud</span>
            Cloudflare Resources
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              { name: 'D1 Database',      icon: 'table_chart',    desc: 'Audit · Sessions · Analytics · Files', colour: '#f97316' },
              { name: 'KV Storage',       icon: 'speed',          desc: 'Cache · Sessions · Rate-limit', colour: '#3b82f6' },
              { name: 'R2 Object Store',  icon: 'folder_open',    desc: 'Medical files · DICOM · PDFs', colour: '#10b981' },
              { name: 'Durable Objects',  icon: 'sync_alt',       desc: 'Presence · Notifications', colour: '#8b5cf6' },
              { name: 'Secret Store',     icon: 'lock',           desc: 'JWT · IRIS · NPHIES · Gemini', colour: '#ef4444' },
            ].map(res => (
              <div key={res.name} className="bg-background-dark rounded-xl p-3 flex flex-col gap-2">
                <span className="material-symbols-outlined text-[24px]" style={{ color: res.colour }}>{res.icon}</span>
                <p className="text-white text-xs font-semibold">{res.name}</p>
                <p className="text-text-secondary text-[10px] leading-tight">{res.desc}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-green-400 mt-auto">
                  <span className="w-1 h-1 rounded-full bg-green-400" />
                  Configured
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
