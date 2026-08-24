// Web Audio API Sound Synthesizer for RFID & NFC Reader Feedback

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.setupUnlockListeners();
  }

  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.init();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.isUnlocked = true;
      ['click', 'touchstart', 'touchend', 'keydown', 'mousedown'].forEach(event => {
        window.removeEventListener(event, unlock);
      });
    };

    ['click', 'touchstart', 'touchend', 'keydown', 'mousedown'].forEach(event => {
      window.addEventListener(event, unlock, { once: false, passive: true });
    });
  }

  private init() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // Instant short blip when sensor detects card/camera reads barcode
  playScanBlip() {
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now); // A6
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio fails gracefully
    }
  }

  // Double high pleasant chime for successful check-in ("Selamat Datang")
  playCheckInSound() {
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Note 1: High crisp bell (A5 = 880Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: Higher celebratory bell (E6 = 1318.51Hz + harmonic undertone)
      const osc2 = this.audioCtx.createOscillator();
      const osc2Harmonic = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, now + 0.1);

      osc2Harmonic.type = 'sine';
      osc2Harmonic.frequency.setValueAtTime(1760, now + 0.1);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.22, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc2.connect(gain2);
      osc2Harmonic.connect(gain2);
      gain2.connect(this.audioCtx.destination);

      osc2.start(now + 0.1);
      osc2Harmonic.start(now + 0.1);
      osc2.stop(now + 0.55);
      osc2Harmonic.stop(now + 0.55);
    } catch {
      // Audio playback fails gracefully
    }
  }

  // Melodic warm descending chord for check-out ("Sampai Jumpa")
  playCheckOutSound() {
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [
        { freq: 783.99, delay: 0, duration: 0.25 },     // G5
        { freq: 659.25, delay: 0.12, duration: 0.25 },  // E5
        { freq: 523.25, delay: 0.24, duration: 0.45 },  // C5
      ];

      notes.forEach(({ freq, delay, duration }) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + duration);
      });
    } catch {
      // Graceful
    }
  }

  // Clear, unmistakable double buzz warning for failed / unregistered tap
  playErrorSound() {
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Pulse 1: Low dissonance buzzer (180Hz / 130Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.linearRampToValueAtTime(130, now + 0.16);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.16);

      // Pulse 2: Second lower buzz after 80ms silence
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(150, now + 0.22);
      osc2.frequency.linearRampToValueAtTime(110, now + 0.42);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.22, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.42);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.42);
    } catch {
      // Graceful
    }
  }
}

export const soundManager = new SoundManager();

