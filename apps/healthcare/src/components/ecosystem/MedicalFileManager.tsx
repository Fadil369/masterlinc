import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'https://brainsait-gateway.brainsait-fadil.workers.dev'
const AUTH_TOKEN = typeof localStorage !== 'undefined' ? (localStorage.getItem('brainsait_token') ?? '') : ''

function authFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${GATEWAY}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${AUTH_TOKEN}`, ...opts.headers },
  })
}

type FileType = 'dicom' | 'pdf' | 'image' | 'report' | 'other'

interface MedicalFile {
  id: string
  filename: string
  mime_type: string
  size_bytes: number
  file_type: FileType
  uploaded_at: number
  iris_ref?: string
}

const FILE_ICONS: Record<FileType, string> = {
  dicom:  'radiology',
  pdf:    'picture_as_pdf',
  image:  'image',
  report: 'description',
  other:  'attach_file',
}
const FILE_COLOURS: Record<FileType, string> = {
  dicom:  '#8b5cf6',
  pdf:    '#ef4444',
  image:  '#3b82f6',
  report: '#10b981',
  other:  '#6b7280',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function MedicalFileManager() {
  const [files, setFiles] = useState<MedicalFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [studyId, setStudyId] = useState('')
  const [fileType, setFileType] = useState<FileType>('other')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (patientId) params.set('patient_id', patientId)
      if (studyId)   params.set('study_id', studyId)
      const r = await authFetch(`/api/files?${params}`)
      const d = await r.json() as { files: MedicalFile[] }
      setFiles(d.files ?? [])
    } catch {
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [patientId, studyId])

  const upload = useCallback(async (file: File) => {
    if (file.size > 500 * 1024 * 1024) { toast.error('File too large (max 500 MB)'); return }
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    if (patientId) form.append('patient_id', patientId)
    if (studyId)   form.append('study_id', studyId)
    form.append('file_type', fileType)
    try {
      const r = await authFetch('/api/files/upload', { method: 'POST', body: form })
      if (!r.ok) { const e = await r.json() as { error: string }; throw new Error(e.error) }
      toast.success(`Uploaded ${file.name}`)
      loadFiles()
    } catch (e: unknown) {
      toast.error(`Upload failed: ${(e as Error).message}`)
    } finally {
      setUploading(false)
    }
  }, [patientId, studyId, fileType, loadFiles])

  const deleteFile = async (id: string, filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return
    try {
      await authFetch(`/api/files/${id}`, { method: 'DELETE' })
      toast.success('Deleted')
      setFiles(f => f.filter(x => x.id !== id))
    } catch {
      toast.error('Delete failed')
    }
  }

  const downloadFile = (id: string, filename: string) => {
    const a = document.createElement('a')
    a.href = `${GATEWAY}/api/files/${id}`
    a.download = filename
    a.click()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em]">Medical File Manager</h1>
            <p className="text-text-secondary text-sm mt-1">
              Cloudflare R2 · DICOM · PDFs · Reports · Linked to IRIS FHIR
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="material-symbols-outlined text-[16px] text-orange-400">folder_open</span>
            R2 Object Storage
          </div>
        </div>

        {/* ─── Filter + Upload controls ─── */}
        <div className="bg-surface-dark-lighter rounded-2xl p-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Patient ID</label>
              <input value={patientId} onChange={e => setPatientId(e.target.value)}
                placeholder="e.g. patient-abc123"
                className="w-full px-3 py-2 bg-background-dark text-white rounded-lg text-sm border border-white/10 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Study ID</label>
              <input value={studyId} onChange={e => setStudyId(e.target.value)}
                placeholder="e.g. study-xyz789"
                className="w-full px-3 py-2 bg-background-dark text-white rounded-lg text-sm border border-white/10 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">File Type</label>
              <select value={fileType} onChange={e => setFileType(e.target.value as FileType)}
                className="w-full px-3 py-2 bg-background-dark text-white rounded-lg text-sm border border-white/10 focus:border-blue-500 focus:outline-none">
                {(['dicom', 'pdf', 'image', 'report', 'other'] as FileType[]).map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={loadFiles} disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">search</span>
              {loading ? 'Loading…' : 'Load Files'}
            </button>
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
              {uploading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-[18px]">upload</span>}
              {uploading ? 'Uploading…' : 'Upload File'}
            </button>
            <input ref={inputRef} type="file" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
          </div>
        </div>

        {/* ─── Drag & Drop zone ─── */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            dragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'
          }`}>
          <span className="material-symbols-outlined text-[48px] text-text-secondary">
            {dragging ? 'file_upload' : 'cloud_upload'}
          </span>
          <p className="text-white font-semibold mt-2">
            {dragging ? 'Drop to upload' : 'Drag & drop medical files here'}
          </p>
          <p className="text-text-secondary text-xs mt-1">DICOM, PDF, JPEG, PNG, TIFF · Max 500 MB · Stored in Cloudflare R2</p>
        </div>

        {/* ─── File list ─── */}
        {files.length > 0 && (
          <div className="bg-surface-dark-lighter rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10">
              <h3 className="text-white text-sm font-semibold">{files.length} file{files.length !== 1 ? 's' : ''}</h3>
            </div>
            <div className="divide-y divide-white/5">
              {files.map(file => {
                const ft = file.file_type ?? 'other'
                return (
                  <div key={file.id} className="px-5 py-3 flex items-center gap-4 hover:bg-background-dark/50 group">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: FILE_COLOURS[ft] + '22' }}>
                      <span className="material-symbols-outlined text-[20px]"
                        style={{ color: FILE_COLOURS[ft] }}>{FILE_ICONS[ft]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{file.filename}</p>
                      <p className="text-text-secondary text-xs">
                        {formatBytes(file.size_bytes)} · {file.mime_type} · {new Date(file.uploaded_at * 1000).toLocaleDateString()}
                        {file.iris_ref && <span className="ml-2 text-cyan-400">↗ {file.iris_ref}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => downloadFile(file.id, file.filename)}
                        className="p-1.5 text-text-secondary hover:text-white rounded-lg hover:bg-surface-dark transition-colors">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                      <button onClick={() => deleteFile(file.id, file.filename)}
                        className="p-1.5 text-text-secondary hover:text-red-400 rounded-lg hover:bg-surface-dark transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
