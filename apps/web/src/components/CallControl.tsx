import React from 'react';
import { CallStatus } from '../types';

interface CallControlProps {
  status: CallStatus;
  onStart: () => void;
  onEnd: () => void;
}

const CallControl: React.FC<CallControlProps> = ({ status, onStart, onEnd }) => {
  const isActive = status === CallStatus.ACTIVE;
  const isConnecting = status === CallStatus.CONNECTING;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      {isActive && (
        <div className="mb-4 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium animate-pulse">
          Basma is Listening...
        </div>
      )}
      <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-md border border-gray-200 p-4 rounded-3xl shadow-2xl">
        <button
          onClick={isActive ? onEnd : onStart}
          disabled={isConnecting}
          className={`group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
          } shadow-lg`}
        >
          {isConnecting ? (
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent" />
          ) : isActive ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18h12V6H6v12z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          )}
        </button>
        <div className="pr-4 border-l border-gray-200 pl-4 hidden md:block">
          <p className="text-sm font-semibold text-gray-800">
            {isActive ? "End Call" : "Speak to Basma"}
          </p>
          <p className="text-xs text-gray-500">
            {isActive ? "Connected" : "Bilingual AI Secretary"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CallControl;
