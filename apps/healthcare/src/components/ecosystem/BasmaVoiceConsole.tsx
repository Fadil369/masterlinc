import { useEffect, useState } from 'react'
import { basma } from '../../lib/basma-client'
import { EnhancedCard } from '../ui/EnhancedCard'
import { AnimatedButton } from '../ui/AnimatedButton'

export function BasmaVoiceConsole() {
  const [health, setHealth] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [from, setFrom] = useState('+15550001111')
  const [to, setTo] = useState('+15550002222')
  const [message, setMessage] = useState('Hello, this is Basma voice demo call from MasterLinc.')

  const [lastCallId, setLastCallId] = useState<string>('')
  const [transcript, setTranscript] = useState<string>('')

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const h = await basma.health()
      setHealth(h)
      const s = await basma.statistics()
      setStats(s)
    } catch (e: any) {
      setHealth({ offline: true })
      setStats(null)
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function makeCall() {
    setLoading(true)
    setError(null)
    try {
      const res = await basma.makeCall({ from, to, message })
      const callId = res?.callId || res?.call_id || ''
      setLastCallId(callId)
      alert(`Call initiated: ${callId || 'OK'}`)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function fetchTranscript() {
    if (!lastCallId) return
    setLoading(true)
    setError(null)
    try {
      const res = await basma.transcript(lastCallId)
      setTranscript(res?.transcript || JSON.stringify(res, null, 2))
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
          <h1 className="text-2xl font-bold text-white">BASMA Voice Console</h1>
          <p className="text-text-secondary">Outbound call demo + statistics + transcript (if BASMA worker running).</p>
        </div>
        <AnimatedButton onClick={refresh} disabled={loading}>Refresh</AnimatedButton>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnhancedCard title="Service Health">
          <pre className="text-xs text-text-secondary whitespace-pre-wrap">{JSON.stringify(health, null, 2)}</pre>
        </EnhancedCard>

        <EnhancedCard title="Call Statistics">
          <pre className="text-xs text-text-secondary whitespace-pre-wrap">{JSON.stringify(stats, null, 2)}</pre>
        </EnhancedCard>

        <EnhancedCard title="Make Call" description="POST /api/calls/make">
          <div className="space-y-2">
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white" value={from} onChange={(e)=>setFrom(e.target.value)} placeholder="from" />
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white" value={to} onChange={(e)=>setTo(e.target.value)} placeholder="to" />
            <textarea className="w-full bg-black/30 border border-border rounded p-2 text-white" value={message} onChange={(e)=>setMessage(e.target.value)} rows={3} />
            <AnimatedButton onClick={makeCall} disabled={loading || health?.offline}>Make Call</AnimatedButton>
          </div>
        </EnhancedCard>

        <EnhancedCard title="Transcript" description="GET /api/calls/:id/transcript">
          <div className="space-y-2">
            <input className="w-full bg-black/30 border border-border rounded p-2 text-white font-mono" value={lastCallId} onChange={(e)=>setLastCallId(e.target.value)} placeholder="callId" />
            <div className="flex gap-2">
              <AnimatedButton onClick={fetchTranscript} disabled={loading || !lastCallId || health?.offline}>Fetch</AnimatedButton>
            </div>
            <pre className="text-xs text-text-secondary whitespace-pre-wrap">{transcript}</pre>
          </div>
        </EnhancedCard>
      </div>
    </div>
  )
}
