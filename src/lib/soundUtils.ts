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

/**
 * Schedules and executes the luxury tactile "Add to Cart" chime.
 * Organic tactile drop transient + ascending major arpeggio (G5 -> C6 -> G6) with velvet harmonic overtone.
 */
function executeAddToCartChime(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime + 0.008;

    // Warm Low-pass filter for velvety, organic acoustic texture
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, now);
    filter.Q.setValueAtTime(1.1, now);

    // 1. Organic tactile drop (gentle woody/bubble pop)
    const popOsc = ctx.createOscillator();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(360, now);
    popOsc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.0001, now);
    popGain.gain.linearRampToValueAtTime(0.07, now + 0.006);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    // 2. Chime Note 1 (G5 gliding to C6 - warm foundation)
    const t1 = now + 0.012;
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, t1); // G5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, t1 + 0.045); // C6

    const osc1Gain = ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.0001, t1);
    osc1Gain.gain.linearRampToValueAtTime(0.11, t1 + 0.012);
    osc1Gain.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.22);

    // 3. Chime Note 2 (E6 sparkling up to G6 - luxury arrival confirmation)
    const t2 = now + 0.055;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, t2); // E6
    osc2.frequency.exponentialRampToValueAtTime(1567.98, t2 + 0.05); // G6

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.0001, t2);
    osc2Gain.gain.linearRampToValueAtTime(0.13, t2 + 0.014);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.26);

    // 4. Subtle shimmer harmonic (C7 overtone for airy crystal elegance)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2093, t2); // C7
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.0001, t2);
    osc3Gain.gain.linearRampToValueAtTime(0.028, t2 + 0.01);
    osc3Gain.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.16);

    // Routing
    popOsc.connect(popGain);
    popGain.connect(filter);

    osc1.connect(osc1Gain);
    osc1Gain.connect(filter);

    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);

    osc3.connect(osc3Gain);
    osc3Gain.connect(filter);

    filter.connect(ctx.destination);

    // Playback
    popOsc.start(now);
    popOsc.stop(now + 0.06);

    osc1.start(t1);
    osc1.stop(t1 + 0.24);

    osc2.start(t2);
    osc2.stop(t2 + 0.28);

    osc3.start(t2);
    osc3.stop(t2 + 0.18);

    // Clean up active nodes after chime completes
    setTimeout(() => {
      try {
        popOsc.disconnect();
        popGain.disconnect();
        osc1.disconnect();
        osc1Gain.disconnect();
        osc2.disconnect();
        osc2Gain.disconnect();
        osc3.disconnect();
        osc3Gain.disconnect();
        filter.disconnect();
      } catch {}
    }, 380);
  } catch {
    // Audio node creation fallback
  }
}

/**
 * Triggers the signature Lumina Home Add-to-Cart tactile chime.
 */
export function playAddToCartSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx = getOrCreateContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume()
        .then(() => executeAddToCartChime(ctx))
        .catch(() => {});
    } else {
      executeAddToCartChime(ctx);
    }
  } catch {
    // Graceful fallback for restricted environments
  }
}
