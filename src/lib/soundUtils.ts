/**
 * Lumina Home — Luxury Sound System
 * Generates short, elegant, crystalline chimes using native Web Audio API.
 * Zero external audio assets, zero latency, velvety harmonic chime.
 */

export function playFavoriteSound() {
  if (typeof window === 'undefined') return;

  try {
    const win = typeof window !== 'undefined' ? (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }) : null;
    const AudioCtx = win?.AudioContext || win?.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Master volume envelope (gentle attack, soft exponential decay)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(0.12, now + 0.016);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    // Warm Low-pass filter to round off harsh highs for an organic, velvety tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);

    // Primary crystalline chime (A5 gliding gracefully to E6 - perfect fifth)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.07); // E6

    // Secondary subtle sparkle harmonic (A6 overtone with fast decay)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now); // A6
    osc2.frequency.exponentialRampToValueAtTime(2093, now + 0.07); // C7

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.035, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    // Routing
    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Playback
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.34);
    osc2.stop(now + 0.2);

    // Clean up AudioContext resource after chime finishes
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 450);
  } catch {
    // Graceful fallback for environments where audio autoplay is restricted
  }
}
