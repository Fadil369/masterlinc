import React from 'react';

interface VoicePulseProps {
  isActive: boolean;
  color?: string;
}

const VoicePulse: React.FC<VoicePulseProps> = ({ isActive, color = 'bg-blue-500' }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-12">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`${color} w-1.5 rounded-full transition-all duration-300 ${
            isActive ? 'animate-bounce' : 'h-2'
          }`}
          style={{
            animationDelay: `${i * 0.15}s`,
            height: isActive ? `${20 + Math.random() * 20}px` : '8px'
          }}
        />
      ))}
    </div>
  );
};

export default VoicePulse;
