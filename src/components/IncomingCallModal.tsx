import React from 'react';
import { Phone, PhoneOff, Shield, Eye, Waves } from 'lucide-react';
import { User } from '../types';

interface IncomingCallModalProps {
  caller: User;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ caller, onAccept, onDecline }) => {
  return (
    <div className="absolute inset-0 z-50 bg-[#060911]/95 backdrop-blur-md flex flex-col justify-between p-6 text-white animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="pt-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-700/50 rounded-full mb-3">
          <Eye size={12} className="text-cyan-400" />
          <span className="text-[11px] font-semibold text-cyan-300">CallSight Voice & Caption Call</span>
        </div>
        <p className="text-xs text-slate-400">Incoming call from</p>
      </div>

      {/* Caller Info & Pulsing Rings */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="relative mb-6">
          <div className="absolute -inset-6 rounded-full bg-cyan-500/10 animate-ping" />
          <div className="absolute -inset-3 rounded-full bg-cyan-500/20 animate-pulse" />
          <img
            src={caller.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'}
            alt={caller.name}
            className="w-28 h-28 rounded-full border-4 border-cyan-400 relative z-10 shadow-2xl object-cover"
          />
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">{caller.name}</h2>
        <p className="text-xs text-cyan-300 mb-2">{caller.email}</p>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800">
          <Shield size={12} className="text-emerald-400" />
          <span>Both parties must consent to transcription</span>
        </div>
      </div>

      {/* Accept & Decline Action Buttons */}
      <div className="pb-8 flex items-center justify-around">
        {/* Decline */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onDecline}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all"
          >
            <PhoneOff size={26} />
          </button>
          <span className="text-xs font-semibold text-slate-300">Decline</span>
        </div>

        {/* Accept */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all animate-bounce"
          >
            <Phone size={26} />
          </button>
          <span className="text-xs font-semibold text-emerald-400">Accept & Connect</span>
        </div>
      </div>
    </div>
  );
};
