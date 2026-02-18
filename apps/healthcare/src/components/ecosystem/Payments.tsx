import { useState } from 'react'
import { payment } from '../../lib/payment-client'
import { audit } from '../../lib/audit-client'
import { toast } from 'sonner'

export function Payments() {
  const [patientId, setPatientId] = useState('patient-demo')
  const [amount, setAmount] = useState(250)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const createIntent = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await payment.createIntent({
        patientId,
        amount,
        currency: 'sar',
        description: 'Telehealth consultation',
      })
      setResult(res)
      toast.success('Payment intent created')

      audit.log({
        actorId: 'demo-user',
        actorRole: 'billing',
        action: 'PAYMENT_CREATE_INTENT',
        resourceType: 'PaymentIntent',
        resourceId: res.paymentIntentId || 'unknown',
        patientId,
        metadata: { amount, currency: 'sar' },
      }).catch(() => {})
    } catch (e: any) {
      toast.error('Failed to create intent')
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    setLoading(true)
    try {
      const h = await payment.history(patientId)
      setResult(h)
      toast.success('Loaded payment history')
    } catch (e: any) {
      toast.error('Failed to load history')
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-white text-2xl font-black">Payments</h2>
        <p className="text-text-secondary text-sm">Create Stripe payment intents via Payment Gateway</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-text-secondary mb-1">Patient ID</label>
          <input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full h-11 rounded-xl bg-surface-dark-lighter border border-border px-4 text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Amount (SAR)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-11 rounded-xl bg-surface-dark-lighter border border-border px-4 text-white"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={createIntent}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60"
        >
          Create Intent
        </button>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-surface-dark-lighter text-white font-semibold disabled:opacity-60"
        >
          Load History
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface-dark p-4">
        <div className="text-white font-bold mb-2">Response</div>
        <pre className="text-xs text-text-secondary overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  )
}
