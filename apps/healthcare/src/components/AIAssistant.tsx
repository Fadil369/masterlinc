import { useState } from 'react'
import { useMasterLinc } from '../hooks/use-masterlinc'

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI healthcare assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')

  const { startConversation, isProcessing } = useMasterLinc();

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return
    
    // Optimistically add user message
    const newMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    
    // Get AI response
    const response = await startConversation(input);
    
    if (response) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.content || 'I processed that request via MasterLinc.' 
      }]);
    } else {
       // Fallback for demo if offline
       setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I am having trouble connecting to the MasterLinc Brain. Please check your connection.' 
      }]);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-hover text-primary-foreground rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50 group"
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-[24px]">close</span>
        ) : (
          <>
            <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-surface-dark rounded-xl border border-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-foreground text-[20px]">
                  smart_toy
                </span>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">AI Assistant</h3>
                <p className="text-text-secondary text-xs">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">minimize</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-primary to-accent' 
                    : 'bg-surface-dark-lighter'
                }`}>
                  <span className="material-symbols-outlined text-[16px] text-white">
                    {message.role === 'user' ? 'person' : 'smart_toy'}
                  </span>
                </div>
                <div className={`max-w-[75%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-dark-lighter text-white'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm transition-all"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
