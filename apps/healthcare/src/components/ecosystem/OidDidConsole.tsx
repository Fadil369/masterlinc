import { useEffect, useState } from 'react'
import { oid } from '../../lib/oid-client'
import { did } from '../../lib/did-client'
import { EnhancedCard } from '../ui/EnhancedCard'
import { AnimatedButton } from '../ui/AnimatedButton'

export function OidDidConsole() {
  const [oidHealth, setOidHealth] = useState<any>(null)
  const [didHealth, setDidHealth] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [oidToResolve, setOidToResolve] = useState('1.3.6.1.4.1.61026.3.1.patient-demo')
  const [didToResolve, setDidToResolve] = useState('did:brainsait:doctor:demo')

  const [registerName, setRegisterName] = useState('Demo Patient')
  const [registerType, setRegisterType] = useState('patient')

  const [doctorName, setDoctorName] = useState('Dr. Demo')
  const [license, setLicense] = useState('LIC-123456')

  const [oidResult, setOidResult] = useState<any>(null)
  const [didResult, setDidResult] = useState<any>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [oh, dh] = await Promise.allSettled([oid.health(), did.health()])
      setOidHealth(oh.status === 'fulfilled' ? oh.value : { offline: true })
      setDidHealth(dh.status === 'fulfilled' ? dh.value : { offline: true })
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function doRegisterOid() {
    setLoading(true)
    setError(null)
    try {
      const res = await oid.register({ type: registerType, name: registerName })
      setOidResult(res)
      if (res?.oid) setOidToResolve(res.oid)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function doResolveOid() {
    setLoading(true)
    setError(null)
    try {
      const res = await oid.resolve(oidToResolve)
      setOidResult(res)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function doCreateDoctorDid() {
    setLoading(true)
    setError(null)
    try {
      const res = await did.createDoctorDid({ doctorName, licenseNumber: license })
      setDidResult(res)
      if (res?.did) setDidToResolve(res.did)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function doResolveDid() {
    setLoading(true)
    setError(null)
    try {
      const res = await did.resolve(didToResolve)
      setDidResult(res)
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
          <h1 className="text-2xl font-bold text-white">OID / DID Console</h1>
          <p className="text-text-secondary">Register/resolve OIDs, create/resolve Doctor DIDs.</p>
        </div>
        <AnimatedButton onClick={refresh} disabled={loading}>Refresh</AnimatedButton>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnhancedCard title="Service Health">
          <div className="text-sm text-text-secondary">OID: <span className="text-white">{oidHealth?.status || (oidHealth?.offline ? 'offline' : 'unknown')}</span></div>
          <div className="text-sm text-text-secondary">DID: <span className="text-white">{didHealth?.status || (didHealth?.offline ? 'offline' : 'unknown')}</span></div>
          <pre className="text-xs text-text-secondary whitespace-pre-wrap mt-2">{JSON.stringify({ oid: oidHealth, did: didHealth }, null, 2)}</pre>
        </EnhancedCard>

        <EnhancedCard title="Register OID" description="POST /api/oid/register">
          <div className="space-y-2">
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white" value={registerType} onChange={(e)=>setRegisterType(e.target.value)} placeholder="type" />
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white" value={registerName} onChange={(e)=>setRegisterName(e.target.value)} placeholder="name" />
            <AnimatedButton onClick={doRegisterOid} disabled={loading}>Register</AnimatedButton>
          </div>
        </EnhancedCard>

        <EnhancedCard title="Resolve OID" description="GET /api/oid/resolve/:oid">
          <div className="space-y-2">
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white font-mono" value={oidToResolve} onChange={(e)=>setOidToResolve(e.target.value)} />
            <AnimatedButton onClick={doResolveOid} disabled={loading}>Resolve</AnimatedButton>
          </div>
        </EnhancedCard>

        <EnhancedCard title="Create Doctor DID" description="POST /api/did/doctor/create">
          <div className="space-y-2">
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white" value={doctorName} onChange={(e)=>setDoctorName(e.target.value)} />
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white" value={license} onChange={(e)=>setLicense(e.target.value)} />
            <AnimatedButton onClick={doCreateDoctorDid} disabled={loading}>Create DID</AnimatedButton>
          </div>
        </EnhancedCard>

        <EnhancedCard title="Resolve DID" description="GET /api/did/resolve/:did">
          <div className="space-y-2">
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white font-mono" value={didToResolve} onChange={(e)=>setDidToResolve(e.target.value)} />
            <AnimatedButton onClick={doResolveDid} disabled={loading}>Resolve</AnimatedButton>
          </div>
        </EnhancedCard>
      </div>

      <EnhancedCard title="Latest Result">
        <pre className="text-xs text-text-secondary whitespace-pre-wrap">{JSON.stringify({ oidResult, didResult }, null, 2)}</pre>
      </EnhancedCard>
    </div>
  )
}
