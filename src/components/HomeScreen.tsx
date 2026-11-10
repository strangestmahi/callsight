import React, { useState, useEffect } from 'react';
import { Search, Phone, History, Settings, FileText, Plus, PhoneCall, CheckCircle2 } from 'lucide-react';
import { User, CallRecord } from '../types';

interface HomeScreenProps {
  currentUser: User;
  onStartCall: (callee: User) => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onViewTranscript: (callId: string) => void;
  onSimulateIncomingCall: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentUser,
  onStartCall,
  onOpenHistory,
  onOpenSettings,
  onViewTranscript,
  onSimulateIncomingCall
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);

  useEffect(() => {
    // Fetch users
    fetch(`/api/v1/users/search?q=${encodeURIComponent(searchQuery)}`)
      .then(r => r.json())
      .then(data => {
        // filter out current user
        setUsers(data.filter((u: User) => u.id !== currentUser.id));
      })
      .catch(() => {});

    // Fetch recent calls
    fetch('/api/v1/calls/history')
      .then(r => r.json())
      .then(data => setRecentCalls(data))
      .catch(() => {});
  }, [searchQuery, currentUser.id]);

  return (
    <div className="flex-1 flex flex-col bg-[#090D16] text-white">
      {/* Header Profile */}
      <div className="p-4 bg-[#0E1526] border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full bg-slate-800 border border-cyan-500/30 object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0E1526]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white leading-tight">{currentUser.name}</h3>
              <span className="px-1.5 py-0.5 text-[9px] bg-cyan-950 text-cyan-400 rounded border border-cyan-800/40">ONLINE</span>
            </div>
            <p className="text-[11px] text-slate-400">{currentUser.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Search Users Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CallSight users to call..."
            className="w-full bg-[#121828] border border-slate-700/80 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 shadow-inner"
          />
        </div>

        {/* Directory / Contact List */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {searchQuery ? 'Search Results' : 'CallSight Directory'}
            </span>
            <span className="text-[11px] text-cyan-400">{users.length} available</span>
          </div>

          <div className="space-y-2">
            {users.map(u => (
              <div
                key={u.id}
                className="p-3 bg-[#111728] hover:bg-[#162035] border border-slate-800/80 rounded-2xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="w-9 h-9 rounded-full bg-slate-800 object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{u.name}</h4>
                    <p className="text-[10px] text-slate-400">{u.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => onStartCall(u)}
                  className="px-3 py-1.5 bg-cyan-400/10 hover:bg-cyan-400 text-cyan-300 hover:text-black font-semibold text-xs rounded-xl border border-cyan-500/30 transition-all flex items-center gap-1.5"
                >
                  <Phone size={13} />
                  <span>Call</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Test Simulator Banner */}
        <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-teal-950/30 to-slate-900 border border-cyan-800/40 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <PhoneCall size={14} className="animate-pulse" />
              <span>Incoming Call Test</span>
            </div>
            <p className="text-[10px] text-slate-400">Trigger simulated incoming call from Elena Vance</p>
          </div>
          <button
            onClick={onSimulateIncomingCall}
            className="px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            Ring Device
          </button>
        </div>

        {/* Recent Calls */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Calls</span>
            <button
              onClick={onOpenHistory}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <History size={12} />
            </button>
          </div>

          <div className="space-y-2">
            {recentCalls.slice(0, 3).map(call => {
              const otherName = call.callerId === currentUser.id ? call.calleeName : call.callerName;
              return (
                <div
                  key={call.id}
                  className="p-3 bg-[#111728] border border-slate-800/70 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                      <PhoneCall size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{otherName}</h4>
                      <p className="text-[10px] text-slate-400">
                        {call.durationSeconds}s • {new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {call.hasTranscript && (
                    <button
                      onClick={() => onViewTranscript(call.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg border border-slate-700 flex items-center gap-1"
                    >
                      <FileText size={11} className="text-cyan-400" />
                      <span>Transcript</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Bar Navigation */}
      <div className="p-3 bg-[#0E1526] border-t border-slate-800/80 flex items-center justify-around">
        <button className="flex flex-col items-center gap-1 text-cyan-400">
          <Phone size={18} />
          <span className="text-[10px] font-bold">Calls</span>
        </button>
        <button
          onClick={onOpenHistory}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <History size={18} />
          <span className="text-[10px]">History</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Settings size={18} />
          <span className="text-[10px]">Settings</span>
        </button>
      </div>
    </div>
  );
};
