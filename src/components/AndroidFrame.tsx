import React from 'react';
import { Wifi, Signal, BatteryMedium } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="relative mx-auto w-full max-w-[410px] h-[840px] bg-[#090D16] border-[8px] border-[#1E293B] rounded-[48px] shadow-2xl overflow-hidden flex flex-col select-none ring-1 ring-cyan-500/20">
      {/* Front camera punch hole & speaker */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <div className="w-12 h-1 bg-slate-800 rounded-full" />
        <div className="w-3.5 h-3.5 bg-black border border-slate-700 rounded-full" />
      </div>

      {/* Android Material 3 Status Bar */}
      <div className="w-full h-8 pt-1 px-6 flex items-center justify-between text-xs font-medium text-slate-300 z-40 bg-[#090D16]/90 backdrop-blur-sm">
        <span>{currentTime}</span>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[10px] font-bold text-cyan-400">5G</span>
          <Signal size={13} />
          <Wifi size={13} />
          <BatteryMedium size={14} className="text-slate-300" />
        </div>
      </div>

      {/* Screen Viewport */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-[#090D16]">
        {children}
      </div>

      {/* Android System Navigation Gesture Bar */}
      <div className="w-full h-5 bg-[#090D16] flex items-center justify-center pb-1">
        <div className="w-32 h-1 bg-slate-600 rounded-full hover:bg-cyan-400 transition-colors" />
      </div>
    </div>
  );
};
