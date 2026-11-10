import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory persistent state for calls, users, transcripts, and highlights
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  status: string;
  durationSeconds: number;
  hasTranscript: boolean;
  callerConsent: boolean;
  calleeConsent: boolean;
  startedAt: string;
  endedAt?: string;
}

interface TranscriptItem {
  id: string;
  callId: string;
  speakerId: string;
  speakerName: string;
  text: string;
  confidence: number;
  timestampMs: number;
  isFinal: boolean;
  highlights?: Array<{ highlightType: string; text: string; context?: string }>;
}

interface SmartHighlight {
  id: string;
  callId: string;
  highlightType: string;
  text: string;
  context: string;
}

interface ChatMessage {
  id: string;
  callId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

const users: User[] = [
  { id: 'usr_1', name: 'Marcus Sterling', email: 'marcus@callsight.io', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_2', name: 'Elena Vance', email: 'elena@callsight.io', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_3', name: 'David Kim', email: 'david@callsight.io', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_4', name: 'Aaliyah Patel', email: 'aaliyah@callsight.io', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' }
];

let callRecords: CallRecord[] = [
  {
    id: 'call_init_01',
    callerId: 'usr_2',
    callerName: 'Elena Vance',
    calleeId: 'usr_1',
    calleeName: 'Marcus Sterling',
    status: 'completed',
    durationSeconds: 142,
    hasTranscript: true,
    callerConsent: true,
    calleeConsent: true,
    startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 3 + 142000).toISOString()
  }
];

let transcriptStore: TranscriptItem[] = [
  {
    id: 'tx_1',
    callId: 'call_init_01',
    speakerId: 'usr_2',
    speakerName: 'Elena Vance',
    text: 'Hello Marcus, are we still meeting tomorrow at two thirty PM to discuss the accessibility sprint?',
    confidence: 0.98,
    timestampMs: Date.now() - 3600000 * 3 + 4000,
    isFinal: true,
    highlights: [
      { highlightType: 'date_time', text: 'tomorrow at two thirty PM' },
      { highlightType: 'question', text: 'are we still meeting tomorrow at two thirty PM to discuss the accessibility sprint?' }
    ]
  },
  {
    id: 'tx_2',
    callId: 'call_init_01',
    speakerId: 'usr_2',
    speakerName: 'Elena Vance',
    text: 'Please confirm if you received the architecture document I sent over earlier.',
    confidence: 0.96,
    timestampMs: Date.now() - 3600000 * 3 + 18000,
    isFinal: true,
    highlights: [
      { highlightType: 'action_item', text: 'Please confirm if you received the architecture document' }
    ]
  }
];

let highlightsStore: SmartHighlight[] = [
  { id: 'hl_1', callId: 'call_init_01', highlightType: 'date_time', text: 'tomorrow at two thirty PM', context: 'Meeting time' },
  { id: 'hl_2', callId: 'call_init_01', highlightType: 'question', text: 'are we still meeting tomorrow?', context: 'Schedule confirmation' },
  { id: 'hl_3', callId: 'call_init_01', highlightType: 'action_item', text: 'Confirm architecture document receipt', context: 'Request' }
];

let chatMessagesStore: ChatMessage[] = [
  {
    id: 'msg_1',
    callId: 'call_init_01',
    senderId: 'usr_1',
    senderName: 'Marcus Sterling',
    content: 'Yes, I got it and reviewed it. Silent reading mode is working perfectly.',
    timestamp: Date.now() - 3600000 * 3 + 24000
  }
];

// Regex extractor for Smart Highlights
function extractHighlights(text: string): Array<{ highlightType: string; text: string; context: string }> {
  const highlights: Array<{ highlightType: string; text: string; context: string }> = [];
  
  // Questions
  const questionMatch = text.match(/(?:^|[.!?]\s*)([^.!?]*\b(?:can|could|would|will|is|are|do|does|did|how|what|when|where|why|who)\b[^.!?]*\?)/i);
  if (questionMatch && questionMatch[1]) {
    highlights.push({ highlightType: 'question', text: questionMatch[1].trim(), context: 'Question asked' });
  }

  // Dates & Times
  const dateMatch = text.match(/\b(?:today|tomorrow|yesterday|tonight|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}|\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm|o'clock))\b/i);
  if (dateMatch) {
    highlights.push({ highlightType: 'date_time', text: dateMatch[0].trim(), context: 'Date or Time' });
  }

  // Action Items
  const actionMatch = text.match(/\b(?:i\s+will|i'll|please|we\s+need\s+to|don't\s+forget\s+to|make\s+sure\s+to|let's|remind\s+me\s+to)\s+([^.!?]+)/i);
  if (actionMatch) {
    highlights.push({ highlightType: 'action_item', text: actionMatch[0].trim(), context: 'Action / Request' });
  }

  // Numbers / Codes
  const numMatch = text.match(/(?:\$\s*\d+|\b\d+(?:\.\d+)?%|\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{4,8}\b)/i);
  if (numMatch) {
    highlights.push({ highlightType: 'number', text: numMatch[0].trim(), context: 'Important number' });
  }

  return highlights;
}

// REST API Endpoints
app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const existing = users.find(u => u.email === email);
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const newUser: User = {
    id: `usr_${Date.now()}`,
    name,
    email,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
  };
  users.push(newUser);
  res.json({
    access_token: `jwt_token_${newUser.id}`,
    token_type: 'bearer',
    user: newUser
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase()) || users[0];
  res.json({
    access_token: `jwt_token_${user.id}`,
    token_type: 'bearer',
    user
  });
});

app.get('/api/v1/users/search', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase();
  const filtered = users.filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
  res.json(filtered);
});

app.get('/api/v1/calls/history', (req, res) => {
  res.json(callRecords);
});

app.post('/api/v1/calls/initiate', (req, res) => {
  const { caller_id, callee_id, caller_name, callee_name } = req.body;
  const newCall: CallRecord = {
    id: `call_${Date.now()}`,
    callerId: caller_id || 'usr_1',
    callerName: caller_name || 'Caller',
    calleeId: callee_id || 'usr_2',
    calleeName: callee_name || 'Elena Vance',
    status: 'in-call',
    durationSeconds: 0,
    hasTranscript: true,
    callerConsent: true,
    calleeConsent: true,
    startedAt: new Date().toISOString()
  };
  callRecords.unshift(newCall);
  res.json(newCall);
});

app.post('/api/v1/calls/:call_id/consent', (req, res) => {
  const { call_id } = req.params;
  const { consent, user_id } = req.body;
  const call = callRecords.find(c => c.id === call_id);
  if (call) {
    if (call.callerId === user_id) call.callerConsent = consent;
    else call.calleeConsent = consent;
  }
  res.json({ call_id, mutual_consent: call ? call.callerConsent && call.calleeConsent : false });
});

app.get('/api/v1/calls/:call_id/transcript', (req, res) => {
  const { call_id } = req.params;
  const items = transcriptStore.filter(t => t.callId === call_id);
  const highlights = highlightsStore.filter(h => h.callId === call_id);
  const messages = chatMessagesStore.filter(m => m.callId === call_id);
  res.json({ call_id, items, highlights, messages });
});

app.delete('/api/v1/calls/:call_id/transcript', (req, res) => {
  const { call_id } = req.params;
  transcriptStore = transcriptStore.filter(t => t.callId !== call_id);
  highlightsStore = highlightsStore.filter(h => h.callId !== call_id);
  const call = callRecords.find(c => c.id === call_id);
  if (call) call.hasTranscript = false;
  res.json({ status: 'deleted', call_id });
});

// Gnani AI Prisma Config Status
app.get('/api/v1/gnani/status', (req, res) => {
  const key = process.env.GNANI_API_KEY || '';
  res.json({
    configured: Boolean(key && key.trim().length > 0),
    masked_key: key ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : null,
    model: 'prisma-v2.5',
    endpoint: 'wss://api.vachana.ai/stt/v3/stream',
    sample_rate: 16000,
    format: 'signed-16bit-pcm-mono'
  });
});

// WebSockets Setup
const wssSignaling = new WebSocketServer({ noServer: true });
const wssAudioStt = new WebSocketServer({ noServer: true });

const signalingClients = new Map<string, WebSocket>();

wssSignaling.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId') || `client_${Date.now()}`;
  signalingClients.set(userId, ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { type, targetId, callId } = data;

      // Broadcast or forward to target client
      if (targetId && signalingClients.has(targetId)) {
        const targetWs = signalingClients.get(targetId);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify(data));
        }
      } else {
        // Broadcast to all other connected clients
        signalingClients.forEach((client, id) => {
          if (id !== userId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }

      // Record text messages in store if message type
      if (type === 'text_message') {
        const newMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          callId: callId || 'call_current',
          senderId: userId,
          senderName: data.senderName || 'Participant',
          content: data.content,
          timestamp: Date.now()
        };
        chatMessagesStore.push(newMsg);
      }
    } catch (e) {
      console.error('Signaling error:', e);
    }
  });

  ws.on('close', () => {
    signalingClients.delete(userId);
  });
});

wssAudioStt.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const callId = url.searchParams.get('callId') || 'call_current';
  const speakerName = url.searchParams.get('speakerName') || 'Elena Vance';
  const speakerId = url.searchParams.get('speakerId') || 'usr_2';

  const gnaniKey = process.env.GNANI_API_KEY;
  let gnaniUpstreamWs: WebSocket | null = null;

  // If Gnani API key is configured, initiate upstream connection to wss://api.vachana.ai/stt/v3/stream
  if (gnaniKey && gnaniKey.trim().length > 0) {
    try {
      gnaniUpstreamWs = new WebSocket('wss://api.vachana.ai/stt/v3/stream', {
        headers: {
          'x-api-key-id': gnaniKey,
          'x-model': 'prisma-v2.5',
          'x-sample-rate': '16000',
          'x-channels': '1',
          'x-encoding': 'signed-pcm'
        }
      });

      gnaniUpstreamWs.on('message', (gnaniData) => {
        try {
          const parsed = JSON.parse(gnaniData.toString());
          const text = parsed.transcript || parsed.text || '';
          const isFinal = Boolean(parsed.is_final || parsed.final);
          const highlights = isFinal ? extractHighlights(text) : [];

          if (text) {
            if (isFinal) {
              const item: TranscriptItem = {
                id: `tx_${Date.now()}`,
                callId,
                speakerId,
                speakerName,
                text,
                confidence: parsed.confidence || 0.98,
                timestampMs: Date.now(),
                isFinal: true,
                highlights
              };
              transcriptStore.push(item);
              highlights.forEach(h => {
                highlightsStore.push({
                  id: `hl_${Date.now()}_${Math.random()}`,
                  callId,
                  highlightType: h.highlightType,
                  text: h.text,
                  context: h.context
                });
              });
            }

            // Send back to client
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                event: 'transcript',
                callId,
                speakerId,
                speakerName,
                text,
                isFinal,
                confidence: parsed.confidence || 0.98,
                highlights
              }));
            }
          }
        } catch (err) {
          console.error('Error parsing Gnani response:', err);
        }
      });
    } catch (err) {
      console.warn('Gnani upstream connection error:', err);
    }
  }

  // Handle incoming audio frames from Android client or WebRTC extractor
  ws.on('message', (message, isBinary) => {
    if (isBinary) {
      // Forward PCM binary chunk to Gnani Prisma if connected
      if (gnaniUpstreamWs && gnaniUpstreamWs.readyState === WebSocket.OPEN) {
        gnaniUpstreamWs.send(message);
      }
    } else {
      // JSON control event (e.g. manual speech transcription simulation or text command)
      try {
        const payload = JSON.parse(message.toString());
        if (payload.event === 'simulate_speech' || payload.event === 'speech_recognized') {
          const text = payload.text;
          const isFinal = payload.isFinal !== false;
          const highlights = isFinal ? extractHighlights(text) : [];

          if (isFinal) {
            const item: TranscriptItem = {
              id: `tx_${Date.now()}`,
              callId,
              speakerId,
              speakerName: payload.speakerName || speakerName,
              text,
              confidence: payload.confidence || 0.99,
              timestampMs: Date.now(),
              isFinal: true,
              highlights
            };
            transcriptStore.push(item);
            highlights.forEach(h => {
              highlightsStore.push({
                id: `hl_${Date.now()}_${Math.random()}`,
                callId,
                highlightType: h.highlightType,
                text: h.text,
                context: h.context
              });
            });
          }

          // Broadcast to connected client
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              event: 'transcript',
              callId,
              speakerId,
              speakerName: payload.speakerName || speakerName,
              text,
              isFinal,
              confidence: payload.confidence || 0.99,
              highlights
            }));
          }
        }
      } catch (e) {
        console.error('Audio WS JSON error:', e);
      }
    }
  });

  ws.on('close', () => {
    if (gnaniUpstreamWs && gnaniUpstreamWs.readyState === WebSocket.OPEN) {
      gnaniUpstreamWs.close();
    }
  });
});

// Route HTTP Upgrade headers to respective WebSocketServer
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

  if (pathname === '/ws/signaling') {
    wssSignaling.handleUpgrade(request, socket, head, (ws) => {
      wssSignaling.emit('connection', ws, request);
    });
  } else if (pathname.startsWith('/ws/calls/') || pathname === '/ws/audio-stt') {
    wssAudioStt.handleUpgrade(request, socket, head, (ws) => {
      wssAudioStt.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`CallSight Server listening on port ${PORT}`);
  });
}

startServer();
