// Rich procedural Web Audio API sound & haptic vibration engine (zero external files)

const PENTATONIC_RATIOS = [
  1.0, // C
  1.125, // D
  1.25, // E
  1.5, // G
  1.667, // A
  2.0, // C5
  2.25, // D5
  2.5, // E5
  3.0, // G5
];

// Gentle cheerful 8-bar kawaii marimba melody (Hz)
const BGM_NOTES = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880.0, 698.46,
  523.25, 659.25, 783.99, 1046.5,
  880.0, 783.99, 659.25, 587.33,
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private vibrationEnabled = true;

  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private bgmPlaying = false;
  private bgmFever = false;

  private ensureGraph(): { ctx: AudioContext; out: AudioNode } | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 18;
        comp.ratio.value = 4;
        comp.attack.value = 0.005;
        comp.release.value = 0.15;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 5200;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.85;

        this.masterGain.connect(lowpass);
        lowpass.connect(comp);
        comp.connect(this.ctx.destination);
      }
    }
    if (!this.ctx || !this.masterGain) return null;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return { ctx: this.ctx, out: this.masterGain };
  }

  public unlock() {
    this.ensureGraph();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopBgm();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
  }

  public isVibrationEnabled(): boolean {
    return this.vibrationEnabled;
  }

  public vibrate(pattern: number | number[]) {
    if (!this.vibrationEnabled || typeof navigator === 'undefined') return;
    if (typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore unsupported vibration errors
      }
    }
  }

  private playTone(
    freq: number,
    options: {
      type?: OscillatorType;
      delay?: number;
      duration?: number;
      volume?: number;
      endFreq?: number;
      overtoneVol?: number;
    } = {},
  ) {
    const graph = this.ensureGraph();
    if (!graph) return;
    const { ctx, out } = graph;

    const delay = options.delay ?? 0;
    const duration = options.duration ?? 0.14;
    const volume = options.volume ?? 0.12;
    const start = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = options.type ?? 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    if (options.endFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, options.endFreq),
        start + duration * 0.85,
      );
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(out);
    osc.start(start);
    osc.stop(start + duration + 0.02);

    // Optional soft bell harmonic overtone
    if (options.overtoneVol && options.overtoneVol > 0) {
      const ov = ctx.createOscillator();
      const ovGain = ctx.createGain();
      ov.type = 'sine';
      ov.frequency.setValueAtTime(freq * 2, start);
      ovGain.gain.setValueAtTime(0.0001, start);
      ovGain.gain.linearRampToValueAtTime(options.overtoneVol, start + 0.008);
      ovGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.65);
      ov.connect(ovGain);
      ovGain.connect(out);
      ov.start(start);
      ov.stop(start + duration * 0.7);
    }
  }

  public startBgm(fever = false) {
    this.bgmFever = fever;
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.scheduleNextBgmStep();
  }

  public setBgmFever(fever: boolean) {
    this.bgmFever = fever;
  }

  public stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleNextBgmStep = () => {
    if (!this.bgmPlaying) return;
    if (!this.muted) {
      const freq = BGM_NOTES[this.bgmStep % BGM_NOTES.length];
      const transpose = this.bgmFever ? 1.12246 : 1.0; // +2 semitones during Fever!
      this.playTone(freq * transpose, {
        type: 'sine',
        duration: 0.22,
        volume: 0.032,
        overtoneVol: 0.01,
      });

      // Soft bass pulse every 4 beats
      if (this.bgmStep % 4 === 0) {
        this.playTone((freq * 0.25) * transpose, {
          type: 'triangle',
          duration: 0.34,
          volume: 0.028,
        });
      }
    }

    this.bgmStep = (this.bgmStep + 1) % BGM_NOTES.length;
    const stepMs = this.bgmFever ? 210 : 280;
    this.bgmTimer = window.setTimeout(this.scheduleNextBgmStep, stepMs);
  };

  public playClick() {
    this.playTone(540, {
      type: 'sine',
      endFreq: 760,
      duration: 0.065,
      volume: 0.08,
      overtoneVol: 0.02,
    });
    this.vibrate(10);
  }

  public playJump() {
    this.playTone(250, {
      type: 'triangle',
      endFreq: 590,
      duration: 0.14,
      volume: 0.12,
    });
    this.playTone(375, {
      type: 'sine',
      delay: 0.02,
      endFreq: 720,
      duration: 0.1,
      volume: 0.06,
    });
    this.vibrate(16);
  }

  public playLand() {
    this.playTone(130, {
      type: 'sine',
      endFreq: 75,
      duration: 0.06,
      volume: 0.06,
    });
  }

  public playCatch(combo: number, isRare = false) {
    const idx = Math.min(combo, PENTATONIC_RATIOS.length - 1);
    const base = 392 * PENTATONIC_RATIOS[idx];

    this.playTone(base, {
      type: 'triangle',
      endFreq: base * 1.08,
      duration: 0.13,
      volume: 0.13,
      overtoneVol: 0.05,
    });

    if (isRare) {
      this.playTone(base * 1.25, {
        type: 'sine',
        delay: 0.05,
        duration: 0.16,
        volume: 0.11,
        overtoneVol: 0.05,
      });
      this.playTone(base * 1.5, {
        type: 'sine',
        delay: 0.1,
        duration: 0.22,
        volume: 0.12,
        overtoneVol: 0.06,
      });
      this.vibrate([22, 28, 36]);
    } else {
      this.vibrate(14);
    }
  }

  public playClockBonus() {
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((f, i) => {
      this.playTone(f, {
        type: 'sine',
        delay: i * 0.05,
        duration: 0.18,
        volume: 0.11,
        overtoneVol: 0.04,
      });
    });
    this.vibrate([20, 25, 35]);
  }

  public playFeverStart() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((f, i) => {
      this.playTone(f, {
        type: 'triangle',
        delay: i * 0.055,
        duration: 0.24,
        volume: 0.13,
        overtoneVol: 0.06,
      });
    });
    this.vibrate([30, 30, 40, 30, 60]);
  }

  public playHazard() {
    this.playTone(195, {
      type: 'sawtooth',
      endFreq: 72,
      duration: 0.24,
      volume: 0.12,
    });
    this.playTone(135, {
      type: 'square',
      delay: 0.03,
      endFreq: 55,
      duration: 0.2,
      volume: 0.07,
    });
    this.vibrate([70, 40, 95]);
  }

  public playTick() {
    this.playTone(880, {
      type: 'sine',
      duration: 0.055,
      volume: 0.07,
    });
  }

  public playExchangeCoin() {
    this.playTone(987.77, {
      type: 'sine',
      duration: 0.09,
      volume: 0.12,
      overtoneVol: 0.05,
    });
    this.playTone(1318.51, {
      type: 'sine',
      delay: 0.075,
      duration: 0.28,
      volume: 0.14,
      overtoneVol: 0.07,
    });
    this.vibrate([20, 30, 40]);
  }

  public playGameOver() {
    this.stopBgm();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this.playTone(f, {
        type: 'triangle',
        delay: i * 0.1,
        duration: i === notes.length - 1 ? 0.45 : 0.2,
        volume: 0.13,
        overtoneVol: 0.05,
      });
    });
    this.vibrate([30, 40, 60]);
  }
}

export const soundEngine = new SoundEngine();
