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
  VolumeX,
  Calendar,
  Clock,
  HelpCircle,
  CheckSquare,
  Hash,
  Eye,
  Info,
  Mic,
  MicOff,
  MessageSquare,
  Radio,
  Sliders,
  FileText,
  Activity,
  Headphones
} from 'lucide-react';
import { TranscriptItem, SmartHighlight, ChatMessage, User, CommunicationMode } from '../types';
import { TextToVoiceService } from '../services/textToVoice';

interface SilentReadingModeScreenProps {
  caller: User;
  callDuration: string;
  transcriptItems: TranscriptItem[];
  interimText: string | null;
  smartHighlights: SmartHighlight[];
  chatMessages: ChatMessage[];
  isPaused: boolean;
  communicationMode: CommunicationMode;
  onSwitchMode: (mode: CommunicationMode) => void;
  onTogglePause: () => void;
  onSendTextMessage: (content: string, isVoiceSpoken?: boolean) => void;
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
  communicationMode,
  onSwitchMode,
  onTogglePause,
  onSendTextMessage,
  onEndCall,
  onBackToCall
}) => {
  const [inputText, setInputText] = useState('');
  const [showHighlightsDrawer, setShowHighlightsDrawer] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [isLocalMicActive, setIsLocalMicActive] = useState(
    communicationMode === 'speaking' || communicationMode === 'voice'
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const ttsService = TextToVoiceService.getInstance();

  // Normalize mode
  const isSpeakingMode = communicationMode === 'speaking' || communicationMode === 'voice';
  const isTranscribingMode = !isSpeakingMode;

  // Auto-scroll to bottom whenever new transcripts, interim text, or chat messages update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcriptItems, interimText, chatMessages]);

  const handleSendSilent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputText.trim()) {
      onSendTextMessage(inputText.trim(), false);
      setInputText('');
    }
  };

  const handleSpeakAloud = (customText?: string) => {
    const textToSpeak = (customText || inputText).trim();
    if (!textToSpeak) return;

    setIsSpeakingNow(true);
    // Play localized synthesized speech into audio output
    ttsService.speak(textToSpeak, {
      rate: speechRate,
      onStart: () => setIsSpeakingNow(true),
      onEnd: () => setIsSpeakingNow(false),
      onError: () => setIsSpeakingNow(false)
    });

    // Send to partner with isVoiceSpoken flag
    onSendTextMessage(textToSpeak, true);
    if (!customText) {
      setInputText('');
    }
  };

  const handleToggleSpeakingMode = () => {
    if (isSpeakingMode) {
      // Switch back to Transcribing Mode
      onSwitchMode('transcribing');
      setIsLocalMicActive(false);
    } else {
      // Switch to Speaking Mode
      onSwitchMode('speaking');
      setIsLocalMicActive(true);
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
      {/* Top App Bar with Call Info */}
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
              <span className="text-xs font-bold text-white leading-none">
                {isSpeakingMode ? 'Speaking Mode' : 'Transcribing Mode'}
              </span>
              {/* Status Indicator */}
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 ${
                  isSpeakingMode
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                    : isPaused
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSpeakingMode ? 'bg-emerald-400 animate-ping' : isPaused ? 'bg-amber-400' : 'bg-cyan-400 animate-pulse'}`} />
                {isSpeakingMode ? 'MIC LIVE' : isPaused ? 'PAUSED' : 'LIVE CAPTIONS'}
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

      {/* Primary Mode Switcher (Transcribing Mode ⇄ Speaking Mode) */}
      <div className="px-3 py-2 bg-[#0B111F] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 bg-[#131C30] p-1 rounded-2xl border border-slate-700/80 w-full max-w-sm mx-auto shadow-inner">
          {/* Transcribing Mode Tab */}
          <button
            onClick={() => {
              onSwitchMode('transcribing');
              setIsLocalMicActive(false);
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              isTranscribingMode
                ? 'bg-cyan-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span>Transcribing Mode</span>
          </button>

          {/* Speaking Mode Tab */}
          <button
            onClick={() => {
              onSwitchMode('speaking');
              setIsLocalMicActive(true);
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              isSpeakingMode
                ? 'bg-emerald-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic size={13} className={isSpeakingMode ? 'animate-bounce' : ''} />
            <span>Speaking Mode</span>
          </button>
        </div>
      </div>

      {/* Voice Synthesizer Settings Popdown */}
      {showVoiceSettings && (
        <div className="bg-[#121A2C] border-b border-cyan-800/40 p-2.5 px-3 shrink-0 flex items-center justify-between text-[11px] animate-in fade-in">
          <div className="flex items-center gap-2">
            <Volume2 size={14} className="text-cyan-400" />
            <span className="font-semibold text-slate-200">TTS Speech Rate:</span>
            <span className="text-cyan-300 font-mono text-[10px]">{speechRate}x</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400 h-1.5 cursor-pointer"
            />
            <button
              onClick={() => handleSpeakAloud("CallSight Text-to-Voice test completed.")}
              className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[10px] font-semibold rounded-lg"
            >
              Test Voice
            </button>
          </div>
        </div>
      )}

      {/* Smart Highlights Dropdown Drawer */}
      {showHighlightsDrawer && (
        <div className="bg-[#10182C] border-b border-cyan-800/40 p-3 max-h-44 overflow-y-auto shrink-0 animate-in slide-in-from-top-2">
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

      {/* Main Conversation Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth"
      >
        {/* Active Mode Banner */}
        {isSpeakingMode ? (
          /* Speaking Mode Active Banner with Animated Visualizer */
          <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-[#0A261D] to-slate-900 border border-emerald-500/60 rounded-2xl flex flex-col gap-2 shadow-lg animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Mic size={16} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Speaking Mode is Live</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </h4>
                  <p className="text-[10px] text-emerald-300/80">Your voice is transmitting directly to {caller.name}.</p>
                </div>
              </div>

              {/* Quick Switch to Transcribing Mode Button */}
              <button
                onClick={() => {
                  onSwitchMode('transcribing');
                  setIsLocalMicActive(false);
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold rounded-xl border border-slate-700 flex items-center gap-1 transition-all"
              >
                <FileText size={11} />
                <span>Switch to Transcribing</span>
              </button>
            </div>

            {/* Audio Wave Sound Bars Animation */}
            <div className="flex items-center justify-center gap-1 py-1 bg-black/40 rounded-xl">
              <span className="text-[9px] text-slate-400 mr-2 font-mono">AUDIO TRANSMITTING:</span>
              <div className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <div className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '75ms' }} />
              <div className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '220ms' }} />
              <div className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
            </div>
          </div>
        ) : (
          /* Transcribing Mode Active Banner */
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between text-[11px] animate-in fade-in">
            <div className="flex items-center gap-2 text-slate-300">
              <Headphones size={15} className="text-cyan-400 shrink-0" />
              <span><strong>Transcribing Mode:</strong> Reading {caller.name}'s speech live via AI captions.</span>
            </div>

            {/* Prominent Button to Switch to Speaking Mode */}
            <button
              onClick={() => {
                onSwitchMode('speaking');
                setIsLocalMicActive(true);
              }}
              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black text-[10px] font-bold rounded-xl border border-emerald-500/40 transition-all flex items-center gap-1 shrink-0"
              title="Turn on microphone to speak directly to caller"
            >
              <Mic size={11} />
              <span>Switch to Speaking</span>
            </button>
          </div>
        )}

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

        {/* User Sent Replies (Distinguish Spoken Voice vs Silent Text) */}
        {chatMessages.map((msg) => (
          <div key={msg.id} className="flex flex-col items-end ml-auto max-w-[85%]">
            <div
              className={`p-3 rounded-2xl rounded-tr-sm text-xs leading-snug shadow-md ${
                msg.isVoiceSpoken
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-semibold ring-2 ring-cyan-300/40'
                  : 'bg-cyan-500/90 text-black font-medium'
              }`}
            >
              <p>{msg.content}</p>
            </div>

            <div className="flex items-center gap-1.5 mt-1 pr-1 text-[9px] text-slate-400">
              {msg.isVoiceSpoken ? (
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Volume2 size={10} className="text-cyan-400 animate-pulse" />
                  <span>Spoken aloud to caller (TTS)</span>
                </span>
              ) : (
                <span>Sent silently</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Reply Suggestion Chips */}
      <div className="px-3 py-1.5 bg-[#0A0E1A] border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {quickReplies.map((reply, i) => (
          <div key={i} className="flex items-center bg-[#131C30] rounded-full border border-slate-700/60 overflow-hidden shrink-0">
            <button
              onClick={() => handleSendSilent(reply as any)}
              className="px-2.5 py-1 text-slate-300 hover:text-white text-[10px] whitespace-nowrap transition-colors"
              title="Send as silent text"
            >
              {reply}
            </button>
            <button
              onClick={() => handleSpeakAloud(reply)}
              className="p-1 pr-2 text-cyan-400 hover:text-cyan-300 hover:bg-[#1C2844] transition-colors"
              title="Speak aloud to caller via Text-to-Voice"
            >
              <Volume2 size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Text Message Input Field & Dual Send / Speak Buttons */}
      <div className="p-2.5 bg-[#0E1526] border-t border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] text-slate-400">
            {isSpeakingMode ? "Speaking Mode: Microphone is live" : "Transcribing Mode: Type or speak to caller"}
          </span>

          {/* Quick Switcher Button right above input */}
          <button
            onClick={handleToggleSpeakingMode}
            className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${
              isSpeakingMode ? 'text-cyan-400 hover:underline' : 'text-emerald-400 hover:underline'
            }`}
          >
            {isSpeakingMode ? (
              <>
                <FileText size={11} />
                <span>Switch to Transcribing Mode</span>
              </>
            ) : (
              <>
                <Mic size={11} />
                <span>Switch to Speaking Mode</span>
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSendSilent} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isSpeakingMode
                ? "Microphone is live! (Or type message to send)..."
                : "Type response (Send silent or Speak aloud)..."
            }
            className="flex-1 bg-[#131C30] border border-slate-700/80 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />

          {/* Speak Aloud Button (Text-to-Voice) */}
          <button
            type="button"
            onClick={() => handleSpeakAloud()}
            disabled={!inputText.trim()}
            className="px-3 h-9 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-md"
            title="Speak aloud to caller using Text-to-Voice"
          >
            <Volume2 size={14} />
            <span>Speak</span>
          </button>

          {/* Send Silent Text Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-cyan-400 border border-slate-700 flex items-center justify-center transition-all shrink-0 shadow-md"
            title="Send silently without sound"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
