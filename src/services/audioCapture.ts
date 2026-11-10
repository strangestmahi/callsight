/**
 * Live audio capture & 16 kHz Mono Signed 16-bit PCM streaming engine.
 * Matches the exact audio format required by Gnani Prisma STT (wss://api.vachana.ai/stt/v3/stream)
 * and the Android RemoteAudioPcmExtractor.
 */

export class AudioStreamingManager {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isCapturing = false;
  private ws: WebSocket | null = null;
  private speechRecognizer: any = null;

  constructor(
    private onInterimTranscript?: (text: string) => void,
    private onFinalTranscript?: (text: string) => void
  ) {}

  public async startCapture(wsEndpoint: string) {
    if (this.isCapturing) return;

    try {
      // Connect WebSocket for audio streaming
      this.ws = new WebSocket(wsEndpoint);
      this.ws.binaryType = 'arraybuffer';

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Use 2048 or 4096 buffer size
      this.processorNode = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.processorNode.onaudioprocess = (event) => {
        if (!this.isCapturing) return;
        const inputData = event.inputBuffer.getChannelData(0);
        const sampleRate = event.inputBuffer.sampleRate;

        // Resample from browser sample rate (usually 44.1k or 48k) to 16,000 Hz
        const pcm16k = this.downsampleTo16kHz(inputData, sampleRate);
        const pcm16bit = this.floatTo16BitPCM(pcm16k);

        // Send 1024-byte chunks over WebSocket to Gnani STT endpoint
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const CHUNK_SIZE = 1024;
          let offset = 0;
          while (offset + CHUNK_SIZE <= pcm16bit.byteLength) {
            const chunkView = new Uint8Array(pcm16bit.buffer, offset, CHUNK_SIZE);
            (this.ws as any).send(chunkView);
            offset += CHUNK_SIZE;
          }
        }
      };

      source.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
      this.isCapturing = true;

      // Also attach Web Speech API if supported in browser for live local dictation feedback
      this.initWebSpeech();
    } catch (err) {
      console.error('Failed to start audio capture:', err);
      throw err;
    }
  }

  private initWebSpeech() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.speechRecognizer = new SpeechRecognition();
        this.speechRecognizer.continuous = true;
        this.speechRecognizer.interimResults = true;
        this.speechRecognizer.lang = 'en-US';

        this.speechRecognizer.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              if (this.onFinalTranscript) this.onFinalTranscript(transcript.trim());
              // Send recognized sentence to server for sync
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                  event: 'speech_recognized',
                  text: transcript.trim(),
                  isFinal: true
                }));
              }
            } else {
              interim += transcript;
            }
          }
          if (interim && this.onInterimTranscript) {
            this.onInterimTranscript(interim.trim());
          }
        };

        this.speechRecognizer.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e.error);
        };

        this.speechRecognizer.start();
      } catch (e) {
        console.warn('Web Speech API initialization:', e);
      }
    }
  }

  public stopCapture() {
    this.isCapturing = false;
    if (this.speechRecognizer) {
      try { this.speechRecognizer.stop(); } catch (e) {}
      this.speechRecognizer = null;
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private downsampleTo16kHz(buffer: Float32Array, inputSampleRate: number): Float32Array {
    if (inputSampleRate === 16000) return buffer;
    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIndex = Math.min(Math.round(i * ratio), buffer.length - 1);
      result[i] = buffer[srcIndex];
    }
    return result;
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }
}
