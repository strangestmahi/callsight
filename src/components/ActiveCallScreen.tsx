import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Eye, ShieldCheck, Activity, MessageSquare } from 'lucide-react';
import { User, CallRecord } from '../types';

interface ActiveCallScreenProps {
  call: CallRecord;
  caller: User;
  onEndCall: () => void;
  onOpenSilentReadingMode: () => void;
}

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({
  call,
  caller,
  onEndCall,
  onOpenSilentReadingMode
}) => {
  const [duration, setDuration] = useState(call.durationSeconds || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#090D16] via-[#0D1527] to-[#090D16] text-white">
      {/* Top Bar Info */}
      <div className="pt-4 flex flex-col items-center">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-700/50 rounded-full mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-300">WebRTC Audio Connected</span>
        </div>
        <span className="text-xl font-mono text-cyan-300 font-bold tracking-wider">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Center Caller Avatar & Audio Wave */}
      <div className="my-auto flex flex-col items-center text-center">
        <div className="relative mb-5">
          <div className="w-32 h-32 rounded-full border-4 border-cyan-400/40 p-1 bg-slate-900 shadow-2xl flex items-center justify-center overflow-hidden">
            <img
              src={caller.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'}
              alt={caller.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <span className="absolute bottom-1 right-2 w-4 h-4 bg-emerald-500 border-2 border-[#090D16] rounded-full" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">{caller.name}</h2>
        <p className="text-xs text-slate-400 mb-4">{caller.email}</p>

        {/* Real-time mutual consent status badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-950/60 px-3.5 py-1.5 rounded-xl border border-cyan-800/40">
          <ShieldCheck size={14} className="text-cyan-400" />
          <span>Mutual Transcription Consent Active</span>
        </div>
      </div>

      {/* Prominent Silent Reading Mode CTA (Core feature of CallSight) */}
      <div className="mb-6">
        <button
          onClick={onOpenSilentReadingMode}
          className="w-full py-4 px-5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 active:scale-[0.99] text-black font-extrabold rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-3 transition-all"
        >
          <Eye size={20} className="shrink-0" />
          <div className="text-left">
            <div className="text-sm leading-tight">Enter Silent Reading Mode</div>
            <div className="text-[10px] text-cyan-950 font-semibold">Read live captions & respond via text</div>
          </div>
        </button>
      </div>

      {/* In-Call Audio Controls & End Call */}
      <div className="pb-4 flex items-center justify-center gap-6">
        {/* Mute Mic */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-950 text-red-400 border border-red-700' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* End Call */}
        <button
          onClick={onEndCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all"
          title="End Call"
        >
          <PhoneOff size={26} />
        </button>

        {/* Speaker Toggle */}
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            !isSpeakerOn ? 'bg-amber-950 text-amber-400 border border-amber-700' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
        >
          {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
      </div>
    </div>
  );
};
