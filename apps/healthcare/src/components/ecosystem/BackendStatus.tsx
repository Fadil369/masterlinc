import { useEffect, useState } from 'react'
import { fhir } from '../../lib/fhir-client'
import { payment } from '../../lib/payment-client'
import { audit } from '../../lib/audit-client'

type Status = 'unknown' | 'ok' | 'down'

export function BackendStatus() {
  const [fhirStatus, setFhirStatus] = useState<Status>('unknown')
  const [paymentStatus, setPaymentStatus] = useState<Status>('unknown')
  const [auditStatus, setAuditStatus] = useState<Status>('unknown')

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const safe = async (fn: () => Promise<any>, set: (s: Status) => void) => {
        try {
          await fn()
          if (!cancelled) set('ok')
        } catch {
          if (!cancelled) set('down')
        }
      }
      await Promise.all([
        safe(() => fhir.health(), setFhirStatus),
        safe(() => payment.health(), setPaymentStatus),
        safe(() => audit.health(), setAuditStatus),
      ])
    }

    check()
    const t = setInterval(check, 15000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const pill = (label: string, s: Status) => {
    const cls =
      s === 'ok'
        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
        : s === 'down'
          ? 'bg-red-500/20 text-red-200 border-red-500/30'
          : 'bg-surface-dark-lighter text-text-secondary border-border'

    return (
      <span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${cls}`}>{label}: {s}</span>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {pill('FHIR', fhirStatus)}
      {pill('PAY', paymentStatus)}
      {pill('AUDIT', auditStatus)}
    </div>
  )
}
