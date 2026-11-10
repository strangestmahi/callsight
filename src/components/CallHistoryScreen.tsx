import React, { useState, useEffect } from 'react';
import { ArrowLeft, PhoneCall, FileText, Trash2, Calendar, Clock, AlertTriangle, Sparkles, X } from 'lucide-react';
import { CallRecord, TranscriptItem, SmartHighlight } from '../types';

interface CallHistoryScreenProps {
  onBack: () => void;
  selectedCallId?: string | null;
}

export const CallHistoryScreen: React.FC<CallHistoryScreenProps> = ({ onBack, selectedCallId }) => {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(selectedCallId || null);
  const [transcriptData, setTranscriptData] = useState<{
    items: TranscriptItem[];
    highlights: SmartHighlight[];
    messages: any[];
  } | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  useEffect(() => {
    fetch('/api/v1/calls/history')
      .then(r => r.json())
      .then(data => setCalls(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeCallId) {
      setLoadingTranscript(true);
      fetch(`/api/v1/calls/${activeCallId}/transcript`)
        .then(r => r.json())
        .then(data => {
          setTranscriptData(data);
          setLoadingTranscript(false);
        })
        .catch(() => setLoadingTranscript(false));
    } else {
      setTranscriptData(null);
    }
  }, [activeCallId]);

  const handleDeleteTranscript = async (callId: string) => {
    if (confirm('Permanently delete this transcript and extracted highlights? This action cannot be undone.')) {
      await fetch(`/api/v1/calls/${callId}/transcript`, { method: 'DELETE' });
      setCalls(prev => prev.map(c => c.id === callId ? { ...c, hasTranscript: false } : c));
      if (activeCallId === callId) {
        setActiveCallId(null);
        setTranscriptData(null);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#090D16] text-white">
      {/* Header */}
      <div className="p-4 bg-[#0E1526] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="text-sm font-bold text-white">Call History</h3>
            <p className="text-[10px] text-slate-400">Previous conversations & transcripts</p>
          </div>
        </div>
      </div>

      {/* Calls List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {calls.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No recorded calls yet.</div>
        ) : (
          calls.map(call => (
            <div
              key={call.id}
              className="p-3.5 bg-[#111728] border border-slate-800/80 rounded-2xl flex flex-col gap-2.5 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                    <PhoneCall size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{call.callerName}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{new Date(call.startedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{call.durationSeconds}s</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {call.hasTranscript ? (
                    <button
                      onClick={() => setActiveCallId(call.id)}
                      className="px-2.5 py-1 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/50 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FileText size={12} className="text-cyan-400" />
                      <span>Transcript</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No transcript</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transcript Detail Modal Overlay */}
      {activeCallId && (
        <div className="absolute inset-0 z-50 bg-[#090D16]/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileText size={16} className="text-cyan-400" />
                <span>Call Transcript & Insights</span>
              </h3>
              <p className="text-[10px] text-slate-400">Consent verified • End-to-end encrypted storage</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDeleteTranscript(activeCallId)}
                className="p-1.5 text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
                title="Delete Transcript"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setActiveCallId(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Transcript Content */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {loadingTranscript ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading transcript data...</div>
            ) : !transcriptData || transcriptData.items.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Transcript was deleted or is empty.</div>
            ) : (
              <>
                {/* Smart Highlights Summary Card */}
                {transcriptData.highlights.length > 0 && (
                  <div className="p-3 bg-[#111C33] border border-cyan-800/40 rounded-2xl space-y-1.5">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                      <Sparkles size={12} />
                      <span>Extracted Highlights</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {transcriptData.highlights.map((hl, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/50"
                        >
                          <strong className="capitalize">{hl.highlightType.replace('_', ' ')}:</strong> {hl.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation Utterances */}
                {transcriptData.items.map((item) => (
                  <div key={item.id} className="p-3 bg-[#12192A] border border-slate-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-cyan-400">{item.speakerName}</span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(item.timestampMs).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{item.text}</p>
                  </div>
                ))}

                {/* Silent Replies */}
                {transcriptData.messages.map((msg) => (
                  <div key={msg.id} className="p-3 bg-cyan-950/60 border border-cyan-700/40 rounded-2xl ml-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-cyan-300">{msg.sender_name || 'You'} (Silent reply)</span>
                    </div>
                    <p className="text-xs text-cyan-100">{msg.content}</p>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Delete Action Bar */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-[10px] text-slate-500">Call ID: {activeCallId}</span>
            <button
              onClick={() => handleDeleteTranscript(activeCallId)}
              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold rounded-xl border border-red-800/60 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
