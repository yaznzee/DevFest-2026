// A simple synthesizer for sound effects to avoid external assets for the demo
class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private beatTimer: number | null = null;

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
    
    // Noise buffer for snare
    const bufferSize = this.ctx.sampleRate * 0.1; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start();
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
}

export const audioService = new AudioService();