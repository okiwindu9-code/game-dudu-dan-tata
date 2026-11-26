// Rich procedural Web Audio API sound & haptic vibration engine with spatial panning & noise bursts

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

// Cheerful 16-step marimba melody (Hz)
const BGM_NOTES = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880.0, 698.46,
  523.25, 659.25, 783.99, 1046.5,
  880.0, 783.99, 659.25, 587.33,
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
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
        comp.threshold.value = -14;
        comp.knee.value = 16;
        comp.ratio.value = 4;
        comp.attack.value = 0.004;
        comp.release.value = 0.14;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 6400;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.92;

        this.masterGain.connect(lowpass);
        lowpass.connect(comp);
        comp.connect(this.ctx.destination);

        // Pre-build 0.5s white noise buffer for sparkles, whooshes, and explosions
        const sampleRate = this.ctx.sampleRate;
        const len = Math.floor(sampleRate * 0.5);
        const buf = this.ctx.createBuffer(1, len, sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buf;
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

  private connectWithPan(
    ctx: AudioContext,
    out: AudioNode,
    source: AudioNode,
    pan = 0,
  ) {
    if (typeof ctx.createStereoPanner === 'function' && Math.abs(pan) > 0.02) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-0.85, Math.min(0.85, pan));
      source.connect(panner);
      panner.connect(out);
    } else {
      source.connect(out);
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
      pan?: number;
    } = {},
  ) {
    const graph = this.ensureGraph();
    if (!graph) return;
    const { ctx, out } = graph;

    const delay = options.delay ?? 0;
    const duration = options.duration ?? 0.14;
    const volume = options.volume ?? 0.13;
    const pan = options.pan ?? 0;
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
    gain.gain.linearRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    this.connectWithPan(ctx, out, gain, pan);
    osc.start(start);
    osc.stop(start + duration + 0.02);

    if (options.overtoneVol && options.overtoneVol > 0) {
      const ov = ctx.createOscillator();
      const ovGain = ctx.createGain();
      ov.type = 'sine';
      ov.frequency.setValueAtTime(freq * 2, start);
      ovGain.gain.setValueAtTime(0.0001, start);
      ovGain.gain.linearRampToValueAtTime(options.overtoneVol, start + 0.006);
      ovGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.7);
      ov.connect(ovGain);
      this.connectWithPan(ctx, out, ovGain, pan);
      ov.start(start);
      ov.stop(start + duration * 0.72);
    }
  }

  private playNoiseBurst(options: {
    delay?: number;
    duration?: number;
    volume?: number;
    filterType?: BiquadFilterType;
    freq?: number;
    endFreq?: number;
    pan?: number;
  } = {}) {
    const graph = this.ensureGraph();
    if (!graph || !this.noiseBuffer) return;
    const { ctx, out } = graph;

    const delay = options.delay ?? 0;
    const duration = options.duration ?? 0.12;
    const volume = options.volume ?? 0.08;
    const start = ctx.currentTime + delay;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = options.filterType ?? 'bandpass';
    filter.frequency.setValueAtTime(options.freq ?? 1600, start);
    if (options.endFreq) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(80, options.endFreq),
        start + duration,
      );
    }
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(filter);
    filter.connect(gain);
    this.connectWithPan(ctx, out, gain, options.pan ?? 0);
    src.start(start);
    src.stop(start + duration + 0.02);
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
      const transpose = this.bgmFever ? 1.12246 : 1.0;
      this.playTone(freq * transpose, {
        type: 'sine',
        duration: 0.22,
        volume: this.bgmFever ? 0.042 : 0.032,
        overtoneVol: 0.012,
      });

      if (this.bgmStep % 4 === 0) {
        this.playTone(freq * 0.25 * transpose, {
          type: 'triangle',
          duration: 0.34,
          volume: this.bgmFever ? 0.038 : 0.028,
        });
      }

      // Crisp gentle shaker pulse on off-beats during Fever Mode
      if (this.bgmFever && this.bgmStep % 2 === 1) {
        this.playNoiseBurst({
          duration: 0.045,
          volume: 0.018,
          filterType: 'highpass',
          freq: 4200,
        });
      }
    }

    this.bgmStep = (this.bgmStep + 1) % BGM_NOTES.length;
    const stepMs = this.bgmFever ? 200 : 275;
    this.bgmTimer = window.setTimeout(this.scheduleNextBgmStep, stepMs);
  };

  public playClick() {
    this.playTone(580, {
      type: 'sine',
      endFreq: 820,
      duration: 0.06,
      volume: 0.08,
      overtoneVol: 0.025,
    });
    this.vibrate(10);
  }

  public playRoundStart(boosted = false) {
    const notes = boosted
      ? [523.25, 659.25, 783.99, 1046.5, 1318.51]
      : [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      this.playTone(f, {
        type: 'triangle',
        delay: i * 0.05,
        duration: 0.18,
        volume: 0.11,
        overtoneVol: 0.04,
      });
    });
    this.vibrate([18, 22, 28]);
  }

  public playJump(pan = 0) {
    this.playTone(255, {
      type: 'triangle',
      endFreq: 640,
      duration: 0.15,
      volume: 0.13,
      pan,
    });
    this.playTone(410, {
      type: 'sine',
      delay: 0.02,
      endFreq: 780,
      duration: 0.11,
      volume: 0.07,
      pan,
    });
    this.playNoiseBurst({
      duration: 0.09,
      volume: 0.035,
      filterType: 'bandpass',
      freq: 900,
      endFreq: 2600,
      pan,
    });
    this.vibrate(16);
  }

  public playLand(pan = 0) {
    this.playTone(135, {
      type: 'sine',
      endFreq: 68,
      duration: 0.07,
      volume: 0.065,
      pan,
    });
  }

  public playCatch(combo: number, isRare = false, pan = 0) {
    const idx = Math.min(combo, PENTATONIC_RATIOS.length - 1);
    const base = 392 * PENTATONIC_RATIOS[idx];

    this.playTone(base, {
      type: 'triangle',
      endFreq: base * 1.1,
      duration: 0.14,
      volume: 0.14,
      overtoneVol: 0.06,
      pan,
    });

    if (isRare) {
      this.playTone(base * 1.25, {
        type: 'sine',
        delay: 0.045,
        duration: 0.17,
        volume: 0.12,
        overtoneVol: 0.06,
        pan,
      });
      this.playTone(base * 1.5, {
        type: 'sine',
        delay: 0.09,
        duration: 0.24,
        volume: 0.13,
        overtoneVol: 0.07,
        pan,
      });
      this.playNoiseBurst({
        delay: 0.02,
        duration: 0.11,
        volume: 0.045,
        filterType: 'highpass',
        freq: 3600,
        pan,
      });
      this.vibrate([22, 25, 38]);
    } else {
      this.playNoiseBurst({
        duration: 0.05,
        volume: 0.022,
        filterType: 'highpass',
        freq: 3000,
        pan,
      });
      this.vibrate(14);
    }
  }

  public playComboMilestone(combo: number) {
    const root = combo >= 15 ? 659.25 : 587.33;
    [1, 1.25, 1.5].forEach((m, i) => {
      this.playTone(root * m, {
        type: 'sine',
        delay: i * 0.04,
        duration: 0.18,
        volume: 0.09,
        overtoneVol: 0.04,
      });
    });
  }

  public playSpectatorCatch(isBomb: boolean, pan = 0) {
    if (isBomb) {
      this.playTone(165, {
        type: 'sawtooth',
        endFreq: 70,
        duration: 0.18,
        volume: 0.07,
        pan,
      });
      return;
    }
    this.playTone(620, {
      type: 'sine',
      endFreq: 860,
      duration: 0.1,
      volume: 0.055,
      overtoneVol: 0.02,
      pan,
    });
  }

  public playClockBonus(pan = 0) {
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((f, i) => {
      this.playTone(f, {
        type: 'sine',
        delay: i * 0.045,
        duration: 0.2,
        volume: 0.12,
        overtoneVol: 0.05,
        pan,
      });
    });
    this.vibrate([20, 25, 35]);
  }

  public playFeverStart() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((f, i) => {
      this.playTone(f, {
        type: 'triangle',
        delay: i * 0.05,
        duration: 0.26,
        volume: 0.14,
        overtoneVol: 0.07,
      });
    });
    this.playNoiseBurst({
      delay: 0.05,
      duration: 0.25,
      volume: 0.055,
      filterType: 'highpass',
      freq: 3200,
    });
    this.vibrate([30, 30, 40, 30, 65]);
  }

  public playHazard(pan = 0) {
    // Punchy sub-bass thud + crunchy crackle + descending cartoon buzz
    this.playTone(145, {
      type: 'sine',
      endFreq: 44,
      duration: 0.28,
      volume: 0.2,
      pan,
    });
    this.playTone(210, {
      type: 'sawtooth',
      endFreq: 68,
      duration: 0.24,
      volume: 0.12,
      pan,
    });
    this.playNoiseBurst({
      duration: 0.24,
      volume: 0.14,
      filterType: 'lowpass',
      freq: 1800,
      endFreq: 260,
      pan,
    });
    this.vibrate([75, 40, 105]);
  }

  public playTick() {
    this.playTone(920, {
      type: 'sine',
      duration: 0.055,
      volume: 0.08,
      overtoneVol: 0.02,
    });
  }

  public playExchangeCoin() {
    this.playTone(987.77, {
      type: 'sine',
      duration: 0.09,
      volume: 0.13,
      overtoneVol: 0.06,
    });
    this.playTone(1318.51, {
      type: 'sine',
      delay: 0.07,
      duration: 0.28,
      volume: 0.15,
      overtoneVol: 0.08,
    });
    this.vibrate([20, 30, 42]);
  }

  public playGameOver() {
    this.stopBgm();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this.playTone(f, {
        type: 'triangle',
        delay: i * 0.095,
        duration: i === notes.length - 1 ? 0.5 : 0.22,
        volume: 0.14,
        overtoneVol: 0.06,
      });
    });
    this.vibrate([30, 40, 60]);
  }
}

export const soundEngine = new SoundEngine();
