import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Pause,
  Play,
  PhoneOff,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  Calendar,
  Clock,
  HelpCircle,
  CheckSquare,
  Hash,
  Eye,
  Info
} from 'lucide-react';
import { TranscriptItem, SmartHighlight, ChatMessage, User } from '../types';

interface SilentReadingModeScreenProps {
  caller: User;
  callDuration: string;
  transcriptItems: TranscriptItem[];
  interimText: string | null;
  smartHighlights: SmartHighlight[];
  chatMessages: ChatMessage[];
  isPaused: boolean;
  onTogglePause: () => void;
  onSendTextMessage: (content: string) => void;
  onEndCall: () => void;
  onBackToCall: () => void;
}

export const SilentReadingModeScreen: React.FC<SilentReadingModeScreenProps> = ({
  caller,
  callDuration,
  transcriptItems,
  interimText,
  smartHighlights,
  chatMessages,
  isPaused,
  onTogglePause,
  onSendTextMessage,
  onEndCall,
  onBackToCall
}) => {
  const [inputText, setInputText] = useState('');
  const [showHighlightsDrawer, setShowHighlightsDrawer] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever new transcripts, interim text, or chat messages update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcriptItems, interimText, chatMessages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputText.trim()) {
      onSendTextMessage(inputText.trim());
      setInputText('');
    }
  };

  const quickReplies = [
    "I'm listening via captions",
    "Could you repeat that?",
    "Understood, thank you",
    "Yes, that works for me"
  ];

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'date_time':
        return <Clock size={12} className="text-cyan-400" />;
      case 'question':
        return <HelpCircle size={12} className="text-amber-400" />;
      case 'action_item':
        return <CheckSquare size={12} className="text-emerald-400" />;
      case 'number':
        return <Hash size={12} className="text-purple-400" />;
      default:
        return <Sparkles size={12} className="text-cyan-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#090D16] text-white overflow-hidden relative">
      {/* Top App Bar with Transcription Status */}
      <div className="px-3 py-2.5 bg-[#0E1526] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToCall}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
            title="Return to Call View"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white leading-none">Silent Reading</span>
              {/* Status Indicator */}
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 ${
                  isPaused
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-cyan-400 animate-pulse'}`} />
                {isPaused ? 'Paused' : 'Live Captions'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {caller.name} • {callDuration}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Highlights Drawer Toggle */}
          <button
            onClick={() => setShowHighlightsDrawer(!showHighlightsDrawer)}
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              showHighlightsDrawer || smartHighlights.length > 0
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Smart Highlights"
          >
            <Sparkles size={13} className="text-cyan-400" />
            <span className="text-[10px] font-bold">{smartHighlights.length}</span>
            {showHighlightsDrawer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Pause / Resume Transcription */}
          <button
            onClick={onTogglePause}
            className={`p-1.5 rounded-xl border transition-colors ${
              isPaused
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={isPaused ? 'Resume live transcription' : 'Pause live transcription'}
          >
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="p-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white transition-colors"
            title="End Call"
          >
            <PhoneOff size={15} />
          </button>
        </div>
      </div>

      {/* Smart Highlights Dropdown Drawer */}
      {showHighlightsDrawer && (
        <div className="bg-[#10182C] border-b border-cyan-800/40 p-3 max-h-48 overflow-y-auto shrink-0 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
              <Sparkles size={12} />
              <span>Extracted Smart Highlights ({smartHighlights.length})</span>
            </span>
            <span className="text-[9px] text-slate-400">Deterministic rule extraction</span>
          </div>

          {smartHighlights.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No key entities detected yet. Highlights appear automatically as the conversation progresses.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {smartHighlights.map((hl, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#162238] border border-cyan-800/50 flex items-center gap-1.5 text-[11px]"
                >
                  {getHighlightIcon(hl.highlightType)}
                  <span className="font-medium text-slate-200">{hl.text}</span>
                  {hl.context && (
                    <span className="text-[9px] text-cyan-400/80">({hl.context})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Transcription Conversation Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth"
      >
        {/* Info banner for silent reading */}
        <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
          <Info size={14} className="text-cyan-400 shrink-0" />
          <span>Remote caller speech is transcribed below. Type silent replies without talking.</span>
        </div>

        {/* Finalized Transcripts */}
        {transcriptItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-start max-w-[92%]"
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-bold text-cyan-400">{item.speakerName}</span>
              <span className="text-[9px] text-slate-400">
                {new Date(item.timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <div className="p-3 bg-[#131C30] border border-slate-800 rounded-2xl rounded-tl-sm text-xs text-slate-100 leading-relaxed shadow-sm">
              <p>{item.text}</p>

              {/* Inline entity chips */}
              {item.highlights && item.highlights.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800/70 flex flex-wrap gap-1">
                  {item.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/40"
                    >
                      {getHighlightIcon(h.highlightType)}
                      {h.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Interim Streaming Speech (Cyan glowing animated bubble) */}
        {interimText && !isPaused && (
          <div className="flex flex-col items-start max-w-[92%] animate-in fade-in">
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                <span>{caller.name}</span>
                <span className="text-[9px] text-cyan-400 font-normal italic">(speaking...)</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>

            <div className="p-3 bg-cyan-950/40 border border-cyan-500/50 rounded-2xl rounded-tl-sm text-xs text-cyan-100 italic leading-relaxed shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30">
              <p>{interimText}</p>
            </div>
          </div>
        )}

        {/* User Sent Text Messages (Silent replies) */}
        {chatMessages.map((msg) => (
          <div key={msg.id} className="flex flex-col items-end ml-auto max-w-[85%]">
            <div className="p-3 bg-cyan-400 text-black font-medium rounded-2xl rounded-tr-sm text-xs leading-snug shadow-md">
              <p>{msg.content}</p>
            </div>
            <span className="text-[9px] text-slate-400 mt-1 pr-1">Sent silently</span>
          </div>
        ))}
      </div>

      {/* Quick Reply Suggestion Chips */}
      <div className="px-3 py-1.5 bg-[#0A0E1A] border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {quickReplies.map((reply, i) => (
          <button
            key={i}
            onClick={() => onSendTextMessage(reply)}
            className="px-2.5 py-1 bg-[#131C30] hover:bg-[#1A2642] text-slate-300 hover:text-cyan-300 text-[10px] rounded-full border border-slate-700/60 whitespace-nowrap transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Bottom Text Message Input Field & Send Button */}
      <div className="p-2.5 bg-[#0E1526] border-t border-slate-800 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type silent text reply..."
            className="flex-1 bg-[#131C30] border border-slate-700/80 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black flex items-center justify-center transition-all shrink-0 shadow-md"
            title="Send Text Message"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
