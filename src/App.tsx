import React, { useState, useEffect, useRef } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { IncomingCallModal } from './components/IncomingCallModal';
import { ActiveCallScreen } from './components/ActiveCallScreen';
import { SilentReadingModeScreen } from './components/SilentReadingModeScreen';
import { CallHistoryScreen } from './components/CallHistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { TestingPanel } from './components/TestingPanel';
import { CodeInspectorModal } from './components/CodeInspectorModal';
import { User, CallRecord, TranscriptItem, SmartHighlight, ChatMessage, ScreenType } from './types';

export default function App() {
  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'usr_1',
    name: 'Marcus Sterling',
    email: 'marcus@callsight.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  });

  // Navigation Screen State
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Call & Signaling State
  const [incomingCaller, setIncomingCaller] = useState<User | null>(null);
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [activePartner, setActivePartner] = useState<User>({
    id: 'usr_2',
    name: 'Elena Vance',
    email: 'elena@callsight.io',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  });
  const [callDurationSec, setCallDurationSec] = useState<number>(0);

  // Live Transcription & Silent Reading Mode Data
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const [interimText, setInterimText] = useState<string | null>(null);
  const [smartHighlights, setSmartHighlights] = useState<SmartHighlight[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTranscriptionPaused, setIsTranscriptionPaused] = useState(false);

  // Inspector & UI Modals
  const [showCodeInspector, setShowCodeInspector] = useState(false);
  const [selectedHistoryCallId, setSelectedHistoryCallId] = useState<string | null>(null);
  const [isDualDeviceMode, setIsDualDeviceMode] = useState(false);

  // WebSockets Refs
  const signalingWsRef = useRef<WebSocket | null>(null);
  const audioSttWsRef = useRef<WebSocket | null>(null);

  // Initialize Signaling WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const signalingUrl = `${protocol}//${window.location.host}/ws/signaling?userId=${currentUser.id}`;

    const ws = new WebSocket(signalingUrl);
    signalingWsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'call_invitation') {
          setIncomingCaller({
            id: data.caller_id,
            name: data.caller_name || 'Elena Vance',
            email: 'caller@callsight.io',
            avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
          });
        } else if (data.type === 'call_ended') {
          handleEndCall();
        } else if (data.type === 'text_message') {
          const newMsg: ChatMessage = {
            id: `msg_${Date.now()}`,
            callId: data.call_id || 'call_current',
            senderId: data.sender_id,
            senderName: data.sender_name || 'Partner',
            content: data.content,
            timestamp: data.timestamp || Date.now()
          };
          setChatMessages((prev) => [...prev, newMsg]);
        }
      } catch (err) {
        console.error('Error handling signaling message:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [currentUser]);

  // Connect Audio STT WebSocket when a call becomes active
  useEffect(() => {
    if (!activeCall) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const audioWsUrl = `${protocol}//${window.location.host}/ws/calls/${activeCall.id}/audio-stt?speakerName=${encodeURIComponent(activePartner.name)}&speakerId=${activePartner.id}`;

    const ws = new WebSocket(audioWsUrl);
    audioSttWsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'transcript') {
          if (payload.is_final || payload.isFinal) {
            setInterimText(null);
            const newItem: TranscriptItem = {
              id: `tx_${Date.now()}_${Math.random()}`,
              callId: activeCall.id,
              speakerId: payload.speakerId || activePartner.id,
              speakerName: payload.speakerName || activePartner.name,
              text: payload.text,
              confidence: payload.confidence || 0.98,
              timestampMs: Date.now(),
              isFinal: true,
              highlights: payload.highlights || []
            };
            setTranscriptItems((prev) => [...prev, newItem]);

            if (payload.highlights && payload.highlights.length > 0) {
              setSmartHighlights((prev) => [...prev, ...payload.highlights]);
            }
          } else {
            setInterimText(payload.text);
          }
        }
      } catch (err) {
        console.error('Error parsing audio STT event:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [activeCall, activePartner]);

  // Call duration counter
  useEffect(() => {
    let interval: any = null;
    if (activeCall) {
      interval = setInterval(() => {
        setCallDurationSec((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDurationSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Call Management Handlers
  const handleStartOutgoingCall = async (callee: User) => {
    setActivePartner(callee);
    const newCall: CallRecord = {
      id: `call_${Date.now()}`,
      callerId: currentUser?.id || 'usr_1',
      callerName: currentUser?.name || 'Marcus Sterling',
      calleeId: callee.id,
      calleeName: callee.name,
      status: 'in-call',
      durationSeconds: 0,
      hasTranscript: true,
      callerConsent: true,
      calleeConsent: true,
      startedAt: new Date().toISOString()
    };
    setActiveCall(newCall);
    setTranscriptItems([]);
    setInterimText(null);
    setSmartHighlights([]);
    setChatMessages([]);
    setCurrentScreen('active_call');

    // Notify backend via REST & signaling
    fetch('/api/v1/calls/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caller_id: currentUser?.id,
        callee_id: callee.id,
        caller_name: currentUser?.name,
        callee_name: callee.name
      })
    }).catch(() => {});
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCaller) return;
    setActivePartner(incomingCaller);
    const newCall: CallRecord = {
      id: `call_${Date.now()}`,
      callerId: incomingCaller.id,
      callerName: incomingCaller.name,
      calleeId: currentUser?.id || 'usr_1',
      calleeName: currentUser?.name || 'Marcus Sterling',
      status: 'in-call',
      durationSeconds: 0,
      hasTranscript: true,
      callerConsent: true,
      calleeConsent: true,
      startedAt: new Date().toISOString()
    };
    setActiveCall(newCall);
    setIncomingCaller(null);
    setTranscriptItems([]);
    setInterimText(null);
    setSmartHighlights([]);
    setChatMessages([]);
    // Automatically open Silent Reading Mode when accepted for instant accessibility
    setCurrentScreen('silent_reading');
  };

  const handleDeclineIncomingCall = () => {
    setIncomingCaller(null);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setInterimText(null);
    setCurrentScreen('home');
  };

  const handleSendTextMessage = (content: string) => {
    if (!activeCall || !currentUser) return;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      callId: activeCall.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: Date.now()
    };
    setChatMessages((prev) => [...prev, newMsg]);

    // Send through signaling WebSocket
    if (signalingWsRef.current && signalingWsRef.current.readyState === WebSocket.OPEN) {
      signalingWsRef.current.send(
        JSON.stringify({
          type: 'text_message',
          call_id: activeCall.id,
          target_id: activePartner.id,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          content,
          timestamp: Date.now()
        })
      );
    }
  };

  const handleSimulateSpeechUtterance = (text: string, isFinal: boolean) => {
    if (isTranscriptionPaused) return;

    if (!isFinal) {
      setInterimText(text);
      return;
    }

    setInterimText(null);

    // Send recognized text to the Audio STT socket so the backend extracts highlights
    if (audioSttWsRef.current && audioSttWsRef.current.readyState === WebSocket.OPEN) {
      audioSttWsRef.current.send(
        JSON.stringify({
          event: 'simulate_speech',
          text,
          isFinal: true,
          speakerName: activePartner.name,
          speakerId: activePartner.id
        })
      );
    } else {
      // Local fallback highlight parsing
      const newItem: TranscriptItem = {
        id: `tx_${Date.now()}`,
        callId: activeCall?.id || 'call_current',
        speakerId: activePartner.id,
        speakerName: activePartner.name,
        text,
        confidence: 0.98,
        timestampMs: Date.now(),
        isFinal: true
      };
      setTranscriptItems((prev) => [...prev, newItem]);
    }
  };

  const handleTriggerSimulatedCall = () => {
    const caller: User = {
      id: 'usr_2',
      name: 'Elena Vance',
      email: 'elena@callsight.io',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
    };
    setIncomingCaller(caller);
  };

  return (
    <div className="min-h-screen bg-[#060911] text-white flex flex-col items-center justify-start p-3 sm:p-6">
      {/* Top Testing & Pipeline Control Bar */}
      <TestingPanel
        onSimulateSpeech={handleSimulateSpeechUtterance}
        onSimulateIncomingCall={handleTriggerSimulatedCall}
        isCallActive={Boolean(activeCall)}
        isInSilentMode={currentScreen === 'silent_reading'}
        isDualDeviceMode={isDualDeviceMode}
        onToggleDualDevice={() => setIsDualDeviceMode(!isDualDeviceMode)}
        onOpenCodeInspector={() => setShowCodeInspector(true)}
      />

      {/* Main Material 3 Android Device Simulator Frame(s) */}
      <div className={`w-full flex items-start justify-center gap-8 ${isDualDeviceMode ? 'flex-col lg:flex-row' : ''}`}>
        {/* Device 1: Marcus Sterling (Receiver / Silent Reader) */}
        <div className="flex flex-col items-center">
          {isDualDeviceMode && (
            <div className="mb-2 px-3 py-1 bg-cyan-950/80 border border-cyan-700/60 rounded-full text-xs font-bold text-cyan-300">
              Device 1: Marcus Sterling (Receiver • Silent Reading)
            </div>
          )}
          <AndroidFrame>
            {/* Welcome Screen */}
            {currentScreen === 'welcome' && (
              <WelcomeScreen
                onSignIn={() => {
                  setAuthMode('login');
                  setCurrentScreen('login');
                }}
                onRegister={() => {
                  setAuthMode('register');
                  setCurrentScreen('register');
                }}
              />
            )}

            {/* Login / Register Authentication Screen */}
            {(currentScreen === 'login' || currentScreen === 'register') && (
              <AuthScreen
                initialMode={authMode}
                onBack={() => setCurrentScreen('welcome')}
                onSuccess={(user) => {
                  setCurrentUser(user);
                  setCurrentScreen('home');
                }}
              />
            )}

            {/* Home Dashboard */}
            {currentScreen === 'home' && currentUser && (
              <HomeScreen
                currentUser={currentUser}
                onStartCall={handleStartOutgoingCall}
                onOpenHistory={() => {
                  setSelectedHistoryCallId(null);
                  setCurrentScreen('history');
                }}
                onOpenSettings={() => setCurrentScreen('settings')}
                onViewTranscript={(callId) => {
                  setSelectedHistoryCallId(callId);
                  setCurrentScreen('history');
                }}
                onSimulateIncomingCall={handleTriggerSimulatedCall}
              />
            )}

            {/* Active Call Screen */}
            {currentScreen === 'active_call' && activeCall && (
              <ActiveCallScreen
                call={activeCall}
                caller={activePartner}
                onEndCall={handleEndCall}
                onOpenSilentReadingMode={() => setCurrentScreen('silent_reading')}
              />
            )}

            {/* Silent Reading Mode Screen (Core Feature) */}
            {currentScreen === 'silent_reading' && (
              <SilentReadingModeScreen
                caller={activePartner}
                callDuration={formatDuration(callDurationSec)}
                transcriptItems={transcriptItems}
                interimText={interimText}
                smartHighlights={smartHighlights}
                chatMessages={chatMessages}
                isPaused={isTranscriptionPaused}
                onTogglePause={() => setIsTranscriptionPaused(!isTranscriptionPaused)}
                onSendTextMessage={handleSendTextMessage}
                onEndCall={handleEndCall}
                onBackToCall={() => setCurrentScreen('active_call')}
              />
            )}

            {/* Call History Screen */}
            {currentScreen === 'history' && (
              <CallHistoryScreen
                selectedCallId={selectedHistoryCallId}
                onBack={() => setCurrentScreen('home')}
              />
            )}

            {/* Settings Screen */}
            {currentScreen === 'settings' && currentUser && (
              <SettingsScreen
                currentUser={currentUser}
                onBack={() => setCurrentScreen('home')}
                onLogout={() => {
                  setCurrentUser(null);
                  setCurrentScreen('welcome');
                }}
              />
            )}

            {/* Incoming Call Overlay */}
            {incomingCaller && (
              <IncomingCallModal
                caller={incomingCaller}
                onAccept={handleAcceptIncomingCall}
                onDecline={handleDeclineIncomingCall}
              />
            )}
          </AndroidFrame>
        </div>

        {/* Device 2: Elena Vance (Caller / Voice Participant & Silent Reply Viewer) */}
        {isDualDeviceMode && (
          <div className="flex flex-col items-center">
            <div className="mb-2 px-3 py-1 bg-teal-950/80 border border-teal-700/60 rounded-full text-xs font-bold text-teal-300">
              Device 2: Elena Vance (Caller • Voice Participant)
            </div>
            <AndroidFrame>
              <div className="flex-1 flex flex-col justify-between p-4 bg-[#090D16] text-white">
                {activeCall ? (
                  <>
                    {/* Active Call Header for Elena */}
                    <div className="pt-2 flex flex-col items-center">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-700 rounded-full mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-300">Call Connected • Speaking</span>
                      </div>
                      <span className="text-sm font-mono text-cyan-300 font-bold">{formatDuration(callDurationSec)}</span>
                      <h4 className="text-sm font-bold text-white mt-1">Talking to Marcus Sterling</h4>
                    </div>

                    {/* Elena's Speech & Real-Time Silent Replies Monitor */}
                    <div className="flex-1 overflow-y-auto my-3 p-3 bg-[#0F1626] border border-slate-800 rounded-2xl flex flex-col gap-2">
                      <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                        <span>Silent Messages from Marcus:</span>
                        <span className="text-cyan-400">{chatMessages.length} received</span>
                      </div>

                      {chatMessages.length === 0 ? (
                        <div className="my-auto text-center text-slate-500 text-xs italic">
                          Marcus can type silent text replies while reading your captions.
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div key={msg.id} className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-xl">
                            <span className="text-[10px] font-bold text-cyan-400 block mb-0.5">{msg.senderName} (Silent Reply):</span>
                            <span className="text-xs text-white leading-relaxed">{msg.content}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Speech Prompt & End Call */}
                    <div className="space-y-2 pb-2">
                      <div className="p-2.5 bg-[#12192B] rounded-xl border border-slate-800 text-[11px] text-slate-300">
                        <span className="text-cyan-400 font-bold">Speaking into mic:</span> Audio frames downsample to 16kHz signed 16-bit PCM for Gnani Prisma STT.
                      </div>
                      <button
                        onClick={handleEndCall}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>End Voice Call</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Standby / Initiate Call Screen for Elena */
                  <div className="my-auto flex flex-col items-center text-center p-4">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
                      alt="Elena Vance"
                      className="w-20 h-20 rounded-full border-2 border-cyan-400 mb-3 object-cover"
                    />
                    <h3 className="text-base font-bold text-white">Elena Vance</h3>
                    <p className="text-xs text-slate-400 mb-6">elena@callsight.io • Ready</p>

                    <button
                      onClick={handleTriggerSimulatedCall}
                      className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>Call Marcus Sterling (Device 1)</span>
                    </button>
                  </div>
                )}
              </div>
            </AndroidFrame>
          </div>
        )}
      </div>

      {/* Native Code Inspector Modal */}
      {showCodeInspector && (
        <CodeInspectorModal onClose={() => setShowCodeInspector(false)} />
      )}
    </div>
  );
}
