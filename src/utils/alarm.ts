/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Continuous Kitchen/Staff Audio Alarm Manager
class AlarmSoundManager {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;
  private isRinging: boolean = false;
  private htmlAudio: HTMLAudioElement | null = null;

  constructor() {
    try {
      this.htmlAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      this.htmlAudio.volume = 0.7;
    } catch {
      this.htmlAudio = null;
    }
  }

  public unlock() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {
      console.warn('AudioContext unlock failed:', e);
    }
  }

  // Synthesizes a loud, high-clarity restaurant kitchen ticket chime
  private playChime() {
    this.unlock();

    // 1. Try HTML Audio
    if (this.htmlAudio) {
      try {
        this.htmlAudio.currentTime = 0;
        this.htmlAudio.play().catch(() => {
          // Autoplay or network fail, will rely on Web Audio synth
        });
      } catch {
        // Fallback to Web Audio
      }
    }

    // 2. Web Audio synthesizer fallback / amplifier (works 100% offline & zero lag)
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.7);

      // Note 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.18);
      gain2.gain.setValueAtTime(0.6, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 1.0);

      // Note 3: 1174.66 Hz (D6) high ringing harmonic
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1174.66, now + 0.36);
      gain3.gain.setValueAtTime(0.4, now + 0.36);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.36);
      osc3.stop(now + 1.2);
    } catch (err) {
      console.warn('Synth chime error:', err);
    }
  }

  // Starts continuous alarm looping until stopped
  public start() {
    if (this.isRinging) return;
    this.isRinging = true;

    // Immediately play first chime
    this.playChime();

    // Repeat every 2.6 seconds continuously
    this.intervalId = setInterval(() => {
      if (this.isRinging) {
        this.playChime();
      }
    }, 2600);
  }

  // Stops audio alarm immediately
  public stop() {
    this.isRinging = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.currentTime = 0;
      } catch {}
    }
  }

  public test() {
    this.playChime();
  }

  public getIsRinging() {
    return this.isRinging;
  }
}

export const alarmSound = new AlarmSoundManager();
