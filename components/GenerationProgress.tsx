
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface GenerationProgressProps {
  isLoading: boolean;
  isVariations?: boolean;
  style?: string;
}

const MESSAGES = [
  "Analyzing room architecture...",
  "Mapping surface textures...",
  "Simulating natural lighting...",
  "Placing designer furniture...",
  "Optimizing photorealism...",
  "Finalizing 4K rendering..."
];

const VARIATION_MESSAGES = [
  "Exploring architectural possibilities...",
  "Generating unique style palettes...",
  "Synthesizing multiple layouts...",
  "Refining material selections...",
  "Rendering diverse visions...",
  "Preparing your options..."
];

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ 
  isLoading, 
  isVariations = false,
  style = "Modern"
}) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = isVariations ? VARIATION_MESSAGES : MESSAGES;

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setMessageIndex(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        // Slower progress as it gets closer to 100
        const increment = Math.max(0.5, (100 - prev) / 20);
        return prev + increment;
      });
    }, 200);

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isLoading, messages.length]);

  if (!isLoading) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-8 py-10">
      <div className="relative w-48 h-48 mx-auto">
        {/* Outer rotating ring */}
        <motion.div 
          className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner pulsing glow */}
        <motion.div 
          className="absolute inset-4 bg-indigo-500/5 rounded-full"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Center icon container */}
        <div className="absolute inset-12 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
          <motion.div
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-12 h-12 text-indigo-600" />
          </motion.div>
        </div>

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
          <circle
            cx="96"
            cy="96"
            r="90"
            fill="transparent"
            stroke="rgba(99, 102, 241, 0.1)"
            strokeWidth="4"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="90"
            fill="transparent"
            stroke="rgb(99, 102, 241)"
            strokeWidth="4"
            strokeDasharray="565.48"
            initial={{ strokeDashoffset: 565.48 }}
            animate={{ strokeDashoffset: 565.48 - (565.48 * progress) / 100 }}
            transition={{ duration: 0.5 }}
          />
        </svg>
      </div>

      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            <motion.h3 
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-bold text-white font-['Outfit'] h-8"
            >
              {messages[messageIndex]}
            </motion.h3>
          </AnimatePresence>
          <p className="text-gray-400 text-sm font-light tracking-wide uppercase">
            {isVariations ? "Generating 3 Unique Visions" : `Transforming to ${style} Style`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <span>Processing</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map((step) => (
            <motion.div
              key={step}
              className={`h-1 w-8 rounded-full ${progress > (step + 1) * 20 ? 'bg-indigo-500' : 'bg-white/10'}`}
              animate={progress > step * 20 && progress <= (step + 1) * 20 ? { opacity: [0.3, 1, 0.3] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
