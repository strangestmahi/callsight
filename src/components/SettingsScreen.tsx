import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Globe, Mic, Database, LogOut, Check, Sliders, Cpu, Info } from 'lucide-react';
import { User } from '../types';

interface SettingsScreenProps {
  currentUser: User;
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser, onBack, onLogout }) => {
  const [language, setLanguage] = useState('en-IN');
  const [requireConsent, setRequireConsent] = useState(true);
  const [saveTranscripts, setSaveTranscripts] = useState(true);
  const [retentionDays, setRetentionDays] = useState('30');
  const [rawAudioStorage, setRawAudioStorage] = useState(false);
  const [gnaniStatus, setGnaniStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/gnani/status')
      .then(r => r.json())
      .then(data => setGnaniStatus(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#090D16] text-white">
      {/* Header */}
      <div className="p-4 bg-[#0E1526] border-b border-slate-800 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-sm font-bold text-white">Settings</h3>
          <p className="text-[10px] text-slate-400">Audio, transcription & privacy preferences</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Gnani AI Integration Status Card */}
        <div className="p-3.5 bg-[#10182C] border border-cyan-800/40 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Cpu size={14} className="text-cyan-400" />
              <span>Gnani AI Prisma STT</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
              gnaniStatus?.configured
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {gnaniStatus?.configured ? 'Active (Prisma v2.5)' : 'Ready / Simulated Mode'}
            </span>
          </div>

          <div className="text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Endpoint:</span>
              <span className="font-mono text-[10px] text-slate-200">wss://api.vachana.ai/stt/v3/stream</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Audio Format:</span>
              <span className="font-mono text-[10px] text-cyan-400">16kHz 1-ch signed 16-bit PCM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">API Key:</span>
              <span className="font-mono text-[10px] text-slate-400">
                {gnaniStatus?.masked_key || 'Configured via GNANI_API_KEY'}
              </span>
            </div>
          </div>
        </div>

        {/* Language Preferences */}
        <div className="p-3.5 bg-[#111728] border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Globe size={14} className="text-cyan-400" />
            <span>Speech Recognition Language</span>
          </div>
          <p className="text-[10px] text-slate-400">Preferred speech dialect for Gnani Prisma STT model.</p>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-[#162035] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="en-IN">English (India) - en-IN</option>
            <option value="en-US">English (US) - en-US</option>
            <option value="hi-IN">Hindi - hi-IN</option>
            <option value="ta-IN">Tamil - ta-IN</option>
            <option value="te-IN">Telugu - te-IN</option>
            <option value="kn-IN">Kannada - kn-IN</option>
          </select>
        </div>

        {/* Privacy & Mutual Consent */}
        <div className="p-3.5 bg-[#111728] border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Shield size={14} className="text-cyan-400" />
            <span>Privacy & Consent Rules</span>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs text-white font-medium block">Mutual Consent Requirement</span>
              <span className="text-[10px] text-slate-400 block">Both participants must agree before transcription starts</span>
            </div>
            <input
              type="checkbox"
              checked={requireConsent}
              onChange={(e) => setRequireConsent(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs text-white font-medium block">Zero Raw Audio Retention</span>
              <span className="text-[10px] text-slate-400 block">Never write uncompressed audio recordings to disk</span>
            </div>
            <input
              type="checkbox"
              checked={!rawAudioStorage}
              disabled
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs text-white font-medium block">Save Conversation Transcripts</span>
              <span className="text-[10px] text-slate-400 block">Allow reviewing previous captions in Call History</span>
            </div>
            <input
              type="checkbox"
              checked={saveTranscripts}
              onChange={(e) => setSaveTranscripts(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </label>
        </div>

        {/* Transcript Retention */}
        <div className="p-3.5 bg-[#111728] border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Database size={14} className="text-cyan-400" />
            <span>Automatic Transcript Purge</span>
          </div>
          <select
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            className="w-full bg-[#162035] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="7">Purge transcripts after 7 days</option>
            <option value="30">Purge transcripts after 30 days</option>
            <option value="90">Purge transcripts after 90 days</option>
            <option value="never">Retain until manually deleted</option>
          </select>
        </div>

        {/* Account Details & Logout */}
        <div className="p-3.5 bg-[#111728] border border-slate-800 rounded-2xl space-y-3">
          <div>
            <span className="text-xs text-slate-400 block">Logged in as</span>
            <span className="text-xs font-bold text-white block">{currentUser.name}</span>
            <span className="text-[11px] text-cyan-400 font-mono block">{currentUser.email}</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-3 bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-bold rounded-xl border border-red-800/60 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>Sign Out of CallSight</span>
          </button>
        </div>
      </div>
    </div>
  );
};
