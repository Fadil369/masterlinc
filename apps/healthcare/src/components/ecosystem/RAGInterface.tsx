import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'https://brainsait-gateway.brainsait-fadil.workers.dev'
const AUTH_TOKEN = typeof localStorage !== 'undefined' ? (localStorage.getItem('brainsait_token') ?? '') : ''

function authFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${GATEWAY}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH_TOKEN}`, ...opts.headers },
  })
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  irisContext?: Array<{ id: string; text: string; resource_type: string }>
  ts: number
  loading?: boolean
}

interface IndexRun {
  id: string
  status: 'running' | 'done' | 'failed'
  indexed: number
  total_resources: number
  errors: number
  started_at: number
  finished_at?: number
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-600 to-cyan-600'
      }`}>
        <span className="material-symbols-outlined text-white text-[16px]">
          {isUser ? 'person' : 'psychiatry'}
        </span>
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-surface-dark-lighter text-white rounded-tl-sm'
        }`}>
          {msg.loading ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : msg.text}
        </div>
        {msg.irisContext && msg.irisContext.length > 0 && (
          <div className="w-full">
            <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-cyan-400">verified</span>
              IRIS Clinical Context ({msg.irisContext.length})
            </p>
            <div className="flex flex-col gap-1">
              {msg.irisContext.map(ctx => (
                <div key={ctx.id} className="bg-background-dark rounded-lg px-3 py-2">
                  <span className="text-[10px] text-cyan-400 font-mono block mb-0.5">{ctx.resource_type}</span>
                  <span className="text-xs text-text-secondary">{ctx.text.slice(0, 120)}{ctx.text.length > 120 ? '…' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <span className="text-[10px] text-text-secondary">
          {new Date(msg.ts).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}

export function RAGInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'مرحباً! I am your BrainSAIT Clinical Knowledge Assistant. Ask me anything about clinical guidelines, diagnoses, medications, or NPHIES billing — in Arabic or English.',
      ts: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [translateAr, setTranslateAr] = useState(false)
  const [includeIris, setIncludeIris] = useState(true)
  const [ragHealth, setRagHealth] = useState<'unknown' | 'online' | 'offline'>('unknown')
  const [indexRuns, setIndexRuns] = useState<IndexRun[]>([])
  const [showIndexPanel, setShowIndexPanel] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    authFetch('/api/rag/health')
      .then(r => r.json())
      .then((d: { reachable?: boolean }) => setRagHealth(d.reachable ? 'online' : 'offline'))
      .catch(() => setRagHealth('offline'))
    loadIndexRuns()
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadIndexRuns = async () => {
    try {
      const r = await authFetch('/api/rag/index/runs')
      const d = await r.json() as { runs: IndexRun[] }
      setIndexRuns(d.runs ?? [])
    } catch {}
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    setInput('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text, ts: Date.now() }
    const loadingMsg: Message = { id: crypto.randomUUID(), role: 'assistant', text: '', ts: Date.now(), loading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])

    try {
      const resp = await authFetch('/api/rag/search', {
        method: 'POST',
        body: JSON.stringify({ text, translate_to_en: translateAr, include_iris_context: includeIris, top_k: 5 }),
      })
      const data = await resp.json() as {
        answer?: string
        iris_clinical_context?: Array<{ id: string; text: string; resource_type: string }>
      }
      setMessages(prev => prev.map(m => m.id === loadingMsg.id
        ? { ...m, loading: false, text: data.answer ?? 'No answer returned.', irisContext: data.iris_clinical_context }
        : m))
    } catch (e: unknown) {
      setMessages(prev => prev.map(m => m.id === loadingMsg.id
        ? { ...m, loading: false, text: `Error: ${(e as Error).message}` }
        : m))
    }
  }, [input, translateAr, includeIris])

  const triggerIndexing = async (patientId?: string) => {
    setIndexing(true)
    try {
      const resp = await authFetch('/api/rag/index/iris', {
        method: 'POST',
        body: JSON.stringify(patientId ? { patient_id: patientId } : {}),
      })
      const d = await resp.json() as { run_id: string }
      toast.success(`IRIS indexing started (run ${d.run_id?.slice(-8)})`)
      loadIndexRuns()
    } catch {
      toast.error('Failed to start indexing')
    } finally {
      setIndexing(false)
    }
  }

  const latestRun = indexRuns[0]

  return (
    <div className="h-full bg-background-dark flex flex-col">
      {/* ─── Header ─── */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[22px]">psychiatry</span>
          </div>
          <div>
            <h1 className="text-white font-black text-lg leading-tight">Clinical RAG Assistant</h1>
            <p className="text-text-secondary text-xs">Powered by IRIS for Health · Arabic & English</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            ragHealth === 'online' ? 'bg-green-500/20 text-green-400' :
            ragHealth === 'offline' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{
              background: ragHealth === 'online' ? '#4ade80' : ragHealth === 'offline' ? '#f87171' : '#fbbf24'
            }} />
            RAG {ragHealth}
          </div>
          <button onClick={() => setShowIndexPanel(p => !p)}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-dark-lighter hover:bg-surface-dark text-white rounded-lg text-xs font-medium transition-colors">
            <span className="material-symbols-outlined text-[16px]">database</span>
            Index Data
            {latestRun?.status === 'running' && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ─── Index Panel ─── */}
      {showIndexPanel && (
        <div className="border-b border-white/10 bg-surface-dark px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-cyan-400">database</span>
              IRIS Clinical Data Indexing
            </h3>
            <button onClick={() => triggerIndexing()}
              disabled={indexing}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
              {indexing ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {indexing ? 'Indexing…' : 'Index All Clinical Data'}
            </button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
            {indexRuns.length === 0
              ? <p className="text-text-secondary text-xs">No index runs yet</p>
              : indexRuns.map(run => (
                <div key={run.id} className="flex items-center gap-3 bg-background-dark rounded-lg px-3 py-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    run.status === 'done' ? 'bg-green-400' :
                    run.status === 'running' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                  }`} />
                  <span className="text-xs text-text-secondary font-mono">{run.id.slice(-8)}</span>
                  <span className="text-xs text-white">{run.indexed} / {run.total_resources} indexed</span>
                  {run.errors > 0 && <span className="text-xs text-red-400">{run.errors} errors</span>}
                  <span className="ml-auto text-[10px] text-text-secondary">
                    {new Date(run.started_at * 1000).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─── Options bar ─── */}
      <div className="px-6 py-2 flex items-center gap-4 border-b border-white/5 bg-background-dark/50">
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => setTranslateAr(p => !p)}
            className={`w-8 h-4 rounded-full transition-colors ${translateAr ? 'bg-blue-600' : 'bg-surface-dark-lighter'}`}>
            <div className={`w-3 h-3 rounded-full bg-white m-0.5 transition-transform ${translateAr ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs text-text-secondary">Translate Arabic → English</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => setIncludeIris(p => !p)}
            className={`w-8 h-4 rounded-full transition-colors ${includeIris ? 'bg-cyan-600' : 'bg-surface-dark-lighter'}`}>
            <div className={`w-3 h-3 rounded-full bg-white m-0.5 transition-transform ${includeIris ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs text-text-secondary">Include IRIS clinical context</span>
        </label>
        <span className="ml-auto text-[10px] text-text-secondary">{messages.length - 1} messages</span>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* ─── Input ─── */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex gap-3 items-end">
          <div className="flex-1 bg-surface-dark-lighter rounded-xl border border-white/10 px-4 py-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask about diagnoses, medications, billing codes, or clinical guidelines… (Arabic or English)"
              rows={2}
              className="w-full bg-transparent text-white text-sm placeholder:text-text-secondary focus:outline-none resize-none"
            />
          </div>
          <button onClick={sendMessage} disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
        <p className="text-[10px] text-text-secondary mt-2 text-center">
          Answers are augmented by InterSystems IRIS for Health FHIR clinical data
        </p>
      </div>
    </div>
  )
}
