import { useState, useEffect } from 'react'

export function VoiceAgent() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setAudioLevel(0)
    }
  }, [isListening])

  const toggleListening = () => {
    setIsListening(!isListening)
    if (!isListening) {
      setTranscript('')
      setTimeout(() => {
        setTranscript('Patient reports chest pain, shortness of breath, and fatigue for the past two days...')
      }, 2000)
    }
  }

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-2">
            Voice Agent
          </h1>
          <p className="text-text-secondary text-base">
            AI-powered voice documentation assistant
          </p>
        </div>

        <div className="bg-surface-dark rounded-xl border border-border p-8 flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <button
              onClick={toggleListening}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 shadow-2xl shadow-red-500/50'
                  : 'bg-primary hover:bg-primary-hover shadow-2xl shadow-primary/50'
              } active:scale-95`}
            >
              <span className="material-symbols-outlined text-white text-[64px]">
                {isListening ? 'stop' : 'mic'}
              </span>
            </button>

            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-30" />
                <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-pulse" />
              </>
            )}
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-white text-2xl font-bold">
              {isListening ? 'Listening...' : 'Ready to Listen'}
            </h2>
            <p className="text-text-secondary">
              {isListening 
                ? 'Speak naturally, I\'m transcribing your notes' 
                : 'Click the microphone to start voice documentation'
              }
            </p>
          </div>

          {isListening && (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center gap-1 h-24">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-primary rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(10, audioLevel * Math.random())}%`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {transcript && (
          <div className="bg-surface-dark rounded-xl border border-border p-6 space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Transcript
              </h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-surface-dark-lighter hover:bg-muted text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </button>
                <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save to Chart
                </button>
              </div>
            </div>
            
            <div className="bg-surface-dark-lighter rounded-lg p-4">
              <p className="text-white text-base leading-relaxed">{transcript}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-dark-lighter rounded-lg p-4">
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold mb-2">
                  Chief Complaint
                </p>
                <p className="text-white text-sm">Chest pain, shortness of breath</p>
              </div>
              
              <div className="bg-surface-dark-lighter rounded-lg p-4">
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold mb-2">
                  Duration
                </p>
                <p className="text-white text-sm">2 days</p>
              </div>
              
              <div className="bg-surface-dark-lighter rounded-lg p-4">
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold mb-2">
                  Severity
                </p>
                <p className="text-white text-sm">Moderate</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-dark rounded-xl border border-border p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">speed</span>
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Fast Documentation</h4>
                <p className="text-text-secondary text-sm">
                  Document patient encounters 3x faster with AI-powered voice transcription
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl border border-border p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Intelligent Structuring</h4>
                <p className="text-text-secondary text-sm">
                  Automatically extracts key clinical information and organizes into chart sections
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl border border-border p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Clinical Accuracy</h4>
                <p className="text-text-secondary text-sm">
                  Medical terminology recognition with 98% accuracy for reliable documentation
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl border border-border p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">security</span>
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">HIPAA Compliant</h4>
                <p className="text-text-secondary text-sm">
                  Enterprise-grade security ensures patient data privacy and regulatory compliance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
