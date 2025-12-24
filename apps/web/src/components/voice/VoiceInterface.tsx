
import React, { useState, useEffect, useRef } from 'react';
import { useSaudiLanguage } from '../../hooks/useSaudiLanguage';

interface VoiceInterfaceProps {
  apiKey: string;
  isLive?: boolean;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ apiKey, isLive = true }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState({ english: '', arabic: '' });
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  
  const { translateToSaudiDialect, formatArabicText } = useSaudiLanguage();

  const handleStart = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setIsThinking(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setTranscript(transcript);
      
      // If result is final, process it
      if (event.results[event.results.length - 1].isFinal) {
        processInput(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Recognition error', event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleStop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const processInput = async (text: string) => {
    setIsThinking(true);
    try {
      // Mock API call for now - in production this hits your worker
      // simulate latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const saudiText = translateToSaudiDialect(text);
      const mockResponse = {
        english: "I understand you need help with a booking. I can assist with that.",
        arabic: formatArabicText("أبشر، فهمت أنك تحتاج مساعدة في الحجز. أقدر أخدمك في هذا الموضوع.")
      };
      
      setResponse(mockResponse);
      setIsThinking(false);
      speakResponse(mockResponse.arabic, 'ar-SA');
    } catch (error) {
      console.error('Processing error', error);
      setIsThinking(false);
    }
  };

  const speakResponse = (text: string, lang: string) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto p-8 rounded-[30px] glass-morphism relative overflow-hidden">
      {/* Visualizer Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <AudioVisualizer isActive={isListening || isSpeaking} level={audioLevel} />
      </div>

      <div className="z-10 text-center">
        <h2 className="orbitron-font text-3xl font-black mb-2 tracking-widest text-white">
          BASMA <span className="text-gold arabic-font">بسمة</span>
        </h2>
        <p className="rajdhani-font text-sm tracking-[0.2em] text-white/60 uppercase">
          Neural Voice Secretary • Saudi Edition
        </p>
      </div>

      {/* Transcription Area */}
      <div className="z-10 w-full min-h-[120px] flex flex-col gap-4 p-6 bg-black/20 rounded-2xl border border-white/5">
        {transcript && (
          <div className="text-right slide-in">
            <p className="text-white/40 text-xs mb-1 rajdhani-font uppercase tracking-wider">User</p>
            <p className="arabic-font text-lg text-white/90">{transcript}</p>
          </div>
        )}
        
        {isThinking ? (
          <div className="text-left mt-2">
            <p className="text-gold/40 text-xs mb-1 rajdhani-font uppercase tracking-wider">Basma</p>
            <span className="thinking-dots rajdhani-font text-gold">Accessing Neural Core</span>
          </div>
        ) : response.arabic && (
          <div className="text-left mt-2 fade-in">
            <p className="text-gold/40 text-xs mb-1 rajdhani-font uppercase tracking-wider">Basma</p>
            <p className="arabic-font text-xl text-gold mb-2">{response.arabic}</p>
            <p className="rajdhani-font text-sm text-white/70 italic">{response.english}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="z-10 flex items-center gap-6">
        {!isListening ? (
          <button 
            onClick={handleStart}
            className="w-20 h-20 rounded-full saudi-gradient flex items-center justify-center gold-shadow transition-all hover:scale-110 active:scale-95 group"
          >
            <div className="w-10 h-10 text-white group-hover:animate-pulse">
              <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            </div>
          </button>
        ) : (
          <button 
            onClick={handleStop}
            className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
             <div className="w-8 h-8 bg-red-600 rounded-sm animate-pulse"></div>
          </button>
        )}
      </div>

      {isListening && (
        <div className="z-10 rajdhani-font text-xs text-saudi-green-light animate-pulse tracking-[0.3em] uppercase">
          Live Uplink Active
        </div>
      )}
    </div>
  );
};

const AudioVisualizer: React.FC<{ isActive: boolean; level: number }> = ({ isActive, level }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-full w-full py-10">
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="w-1 bg-saudi-green-light rounded-full transition-all duration-100"
          style={{ 
            height: isActive ? `${20 + Math.random() * 60}%` : '10%',
            opacity: isActive ? 1 : 0.2
          }}
        />
      ))}
    </div>
  );
};
