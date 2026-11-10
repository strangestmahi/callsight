import React from 'react';
import { Eye, Waves, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onSignIn: () => void;
  onRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSignIn, onRegister }) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#090D16] via-[#0E1526] to-[#090D16] text-white">
      {/* Top Header Badge */}
      <div className="pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/70 border border-cyan-800/40 rounded-full">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-cyan-300 tracking-wide uppercase">AI-Powered Accessibility</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Private & Direct</span>
        </div>
      </div>

      {/* Main Logo & Hero */}
      <div className="my-auto flex flex-col items-center text-center px-2">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-cyan-400 p-0.5 shadow-xl shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B111E] rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <Waves className="absolute text-cyan-500/20 w-16 h-16 animate-pulse" />
              <Eye className="w-11 h-11 text-cyan-400 relative z-10" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-cyan-400 text-black p-1.5 rounded-full shadow-lg">
            <Sparkles size={14} />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Call<span className="text-cyan-400">Sight</span>
        </h1>
        <p className="text-sm font-semibold text-cyan-300/90 mb-4 tracking-wide uppercase">
          See the conversation without having to speak.
        </p>

        <p className="text-xs text-slate-300 leading-relaxed max-w-xs bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
          Real-time AI captions for live voice calls with instant silent text replies, privacy-first mutual consent, and automated smart highlights.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pb-4">
        <button
          onClick={onSignIn}
          className="w-full py-3.5 px-4 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.99] text-black font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 text-sm"
        >
          <span>Sign In to CallSight</span>
          <ArrowRight size={16} />
        </button>

        <button
          onClick={onRegister}
          className="w-full py-3.5 px-4 bg-[#141C2E] hover:bg-[#1A253D] active:scale-[0.99] text-slate-200 font-semibold rounded-2xl border border-slate-700/60 transition-all text-sm"
        >
          Create New Account
        </button>

        <div className="text-center mt-1">
          <span className="text-[10px] text-slate-400">
            Powered by Gnani Prisma STT • Zero SIM interception
          </span>
        </div>
      </div>
    </div>
  );
};
