import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-6 bg-slate-950">
      {/* Device Body Container */}
      <div 
        className="relative flex flex-col overflow-hidden bg-slate-900 border-[12px] border-slate-800 rounded-[50px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
        style={{
          width: 'var(--shell-width)',
          height: 'var(--shell-height)',
          outline: '2px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Notch & Camera Pill */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-[28px] bg-slate-800 rounded-b-[20px] z-50 flex items-center justify-center gap-3">
          {/* Camera lens */}
          <div className="w-3 h-3 bg-slate-950 rounded-full border border-slate-800/40"></div>
          {/* Speaker grill */}
          <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
        </div>

        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-2 text-xs font-semibold text-white/95 select-none z-40 bg-slate-900/60 backdrop-blur-sm h-11">
          {/* Clock */}
          <span>{currentTime}</span>
          
          {/* Status Icons */}
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <span className="text-[10px] tracking-widest font-bold">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 ml-0.5" />
          </div>
        </div>

        {/* Main Content Area (renders the active view) */}
        <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col text-slate-800 relative">
          {children}
        </div>

        {/* Home Screen indicator bar */}
        <div className="h-6 bg-slate-900 flex justify-center items-center z-40">
          <div className="w-28 h-1 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
