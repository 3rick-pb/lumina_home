/**
 * Lumina Home — Luxury Sound System
 * Generates short, elegant, crystalline chimes using native Web Audio API.
 * High-performance singleton AudioContext with zero-latency pre-warming.
 * Eliminates cold-start lag, dropped notes, and hardware delay.
 */

let sharedAudioCtx: AudioContext | null = null;
let isAudioWarmed = false;

/**
 * Retrieves or lazily creates the singleton AudioContext instance.
 * Automatically attempts to resume if in suspended state.
 */
function getOrCreateContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!sharedAudioCtx) {
      const win = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const AudioContextClass = win.AudioContext || win.webkitAudioContext;
      if (!AudioContextClass) return null;

      sharedAudioCtx = new AudioContextClass();
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }

    // Play an ultra-short 1-sample silent pulse to wake hardware buffers (WASAPI / CoreAudio)
    if (!isAudioWarmed && sharedAudioCtx.state === 'running') {
      try {
        const buffer = sharedAudioCtx.createBuffer(1, 1, 22050);
        const source = sharedAudioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(sharedAudioCtx.destination);
        source.start(0);
        isAudioWarmed = true;
      } catch {}
    }

    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Proactive AudioContext unlocker on first user gesture anywhere on the website.
 */
export function warmAudioContext(): void {
  const ctx = getOrCreateContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      isAudioWarmed = true;
    }).catch(() => {});
  }
}

// Auto-register warm-up on first user interaction in browser
if (typeof window !== 'undefined') {
  const onInitialGesture = () => {
    warmAudioContext();
    window.removeEventListener('pointerdown', onInitialGesture);
    window.removeEventListener('touchstart', onInitialGesture);
    window.removeEventListener('keydown', onInitialGesture);
  };

  window.addEventListener('pointerdown', onInitialGesture, { once: true, passive: true });
  window.addEventListener('touchstart', onInitialGesture, { once: true, passive: true });
  window.addEventListener('keydown', onInitialGesture, { once: true, passive: true });
}

/**
 * Schedules and executes the exact luxury crystalline chime.
 */
function executeChime(ctx: AudioContext): void {
  try {
    // 8ms lookahead buffer guarantees the hardware clock has headroom, preventing under-run pops
    const now = ctx.currentTime + 0.008;

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

    // Disconnect active nodes after sound completes to allow clean garbage collection
    // Notice: We NEVER close the shared AudioContext, preserving the warm hardware pipeline.
    setTimeout(() => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        osc2Gain.disconnect();
        filter.disconnect();
        masterGain.disconnect();
      } catch {}
    }, 400);
  } catch {
    // Audio node creation fallback
  }
}

/**
 * Triggers the signature Lumina Home favorite chime with zero cold-start delay.
 */
export function playFavoriteSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx = getOrCreateContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume()
        .then(() => executeChime(ctx))
        .catch(() => {});
    } else {
      executeChime(ctx);
    }
  } catch {
    // Graceful fallback for restricted environments
  }
}
