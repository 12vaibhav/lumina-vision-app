
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface Props {
  before: string;
  after: string;
}

export const BeforeAfterSlider: React.FC<Props> = ({ before, after }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const relativeX = x - rect.left;
    const percentage = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    setSliderPos(percentage);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl group cursor-col-resize select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* After Image (Background) */}
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />

      {/* Before Image (Overlay) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-indigo-500"
          animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 20px rgba(99,102,241,0.4)", "0 0 0px rgba(99,102,241,0)"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7l-4 4m0 0l4 4m-4-4h16M16 7l4 4m0 0l-4 4" />
          </svg>
        </motion.div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Original
      </div>
      <div className="absolute bottom-4 right-4 bg-indigo-500/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-right">
        AI Redesign
      </div>
    </div>
  );
};
