/**
 * Text-to-Voice (TTS) Synthesis Service for CallSight.
 * Converts typed text messages into spoken audio for the remote caller.
 * Allows users who cannot or prefer not to use their vocal cords to participate in voice calls.
 */

export interface TTSVoiceOption {
  id: string;
  name: string;
  lang: string;
}

export class TextToVoiceService {
  private static instance: TextToVoiceService;
  private isSupported: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupported = true;
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public static getInstance(): TextToVoiceService {
    if (!TextToVoiceService.instance) {
      TextToVoiceService.instance = new TextToVoiceService();
    }
    return TextToVoiceService.instance;
  }

  private loadVoices() {
    if (!this.isSupported) return;
    this.availableVoices = window.speechSynthesis.getVoices();
  }

  public getVoices(): TTSVoiceOption[] {
    if (!this.isSupported) return [];
    if (this.availableVoices.length === 0) {
      this.loadVoices();
    }
    return this.availableVoices
      .filter(v => v.lang.startsWith('en') || v.lang.startsWith('hi'))
      .map(v => ({
        id: v.name,
        name: `${v.name} (${v.lang})`,
        lang: v.lang
      }));
  }

  public speak(
    text: string,
    options?: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): boolean {
    if (!this.isSupported || !text.trim()) return false;

    try {
      window.speechSynthesis.cancel(); // Cancel any lingering speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;

      if (options?.voiceName) {
        const matched = this.availableVoices.find(v => v.name === options.voiceName);
        if (matched) utterance.voice = matched;
      } else {
        // Prefer natural sounding English voice if available
        const preferred = this.availableVoices.find(
          v => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
        );
        if (preferred) utterance.voice = preferred;
      }

      if (options?.onStart) utterance.onstart = options.onStart;
      if (options?.onEnd) utterance.onend = options.onEnd;
      if (options?.onError) utterance.onerror = options.onError;

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('Text-to-Voice synthesis error:', err);
      if (options?.onError) options.onError(err);
      return false;
    }
  }

  public stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.isSupported && window.speechSynthesis.speaking;
  }
}
