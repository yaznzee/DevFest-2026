// A simple synthesizer for sound effects to avoid external assets for the demo
class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private beatTimer: number | null = null;
  private beatAudio: HTMLAudioElement | null = null;
  private beatSrc: string | null = null;

  constructor() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("AudioContext not supported");
    }
  }

  private ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setBeatSource(src: string) {
    if (this.beatSrc === src) return;
    this.beatSrc = src;
    if (this.beatAudio) {
      try { this.beatAudio.pause(); } catch (e) { console.warn(e); }
      this.beatAudio = null;
    }
  }

  playBeep(freq: number = 440, type: OscillatorType = 'sine', duration: number = 0.1) {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playKick() {
    this.playBeep(150, 'square', 0.2);
    setTimeout(() => this.playBeep(100, 'sine', 0.3), 50);
  }

  playSnare() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.25);
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.25);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.4, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  playWin() {
    this.playBeep(440, 'sine', 0.2);
    setTimeout(() => this.playBeep(554, 'sine', 0.2), 200);
    setTimeout(() => this.playBeep(659, 'sine', 0.4), 400);
  }

  startBeat(style: 'classic' | 'trap') {
    if (this.beatTimer) this.stopBeat();
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const bpm = style === 'trap' ? 140 : 90;
    const interval = (60 / bpm) * 1000;
    
    let beat = 0;
    this.beatTimer = window.setInterval(() => {
      // Simple 4-count beat logic
      const count = beat % 4;
      
      // Kick on 1
      if (count === 0) {
        this.playKick();
      }
      
      // Snare on 3
      if (count === 2) {
        this.playSnare();
      }
      
      // Hi-hats (simple ticks)
      if (style === 'trap') {
          // Faster hi-hats for trap
          this.playBeep(800, 'triangle', 0.05);
          setTimeout(() => this.playBeep(800, 'triangle', 0.05), interval / 2);
      } else {
          // Regular hi-hats
          this.playBeep(1200, 'triangle', 0.03);
      }

      beat++;
    }, interval);
  }

  stopBeat() {
    if (this.beatTimer) {
      clearInterval(this.beatTimer);
      this.beatTimer = null;
    }
  }

  startBeatTrack(startAtSeconds: number = 0) {
    this.stopBeat();
    if (this.isMuted || !this.beatSrc) return;

    if (!this.beatAudio) {
      this.beatAudio = new Audio(this.beatSrc);
      this.beatAudio.loop = true;
      this.beatAudio.volume = 0.6;
    }

    try {
      const duration = this.beatAudio.duration || 0;
      const safeStart = duration > 0 ? Math.min(Math.max(startAtSeconds, 0), Math.max(duration - 0.1, 0)) : Math.max(startAtSeconds, 0);
      this.beatAudio.currentTime = safeStart;
    } catch (e) {
      console.warn(e);
    }

    this.beatAudio.play().catch((err) => {
      console.warn("Beat track play failed:", err);
    });
  }

  stopBeatTrack() {
    this.stopBeat();
    if (!this.beatAudio) return;
    try {
      this.beatAudio.pause();
      this.beatAudio.currentTime = 0;
    } catch (e) {
      console.warn(e);
    }
  }
}

export const audioService = new AudioService();