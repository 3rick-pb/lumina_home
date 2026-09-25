/**
 * Lumina Home — Luxury Sound System (Zero-Latency Background Pre-Warmed Engine)
 * Generates short, elegant, crystalline chimes and tactile beUI micro-feedback using Web Audio API.
 * Includes silent background execution (`initSilentAudioEngine`) on website startup
 * to wake up the WebAudio synthesis algorithm and OS audio pipeline before the first user action.
 */

let sharedAudioCtx: AudioContext | null = null;
let isAudioWarmed = false;
let keepAliveStarted = false;

/**
 * Retrieves or lazily creates the singleton AudioContext instance.
 */
function getOrCreateContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!sharedAudioCtx) {
      const win = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextClass = win.AudioContext || win.webkitAudioContext;
      if (!AudioContextClass) return null;

      sharedAudioCtx = new AudioContextClass({ latencyHint: "interactive" });
    }

    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }

    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Starts a permanent ultra-silent keep-alive oscillator (gain = 0.0000001)
 * so the OS audio driver (Windows WASAPI / macOS CoreAudio) never suspends or drops the 1st note.
 */
function ensureHardwareKeepAlive(ctx: AudioContext): void {
  if (keepAliveStarted) return;
  try {
    const silentGain = ctx.createGain();
    silentGain.gain.setValueAtTime(0.0000001, ctx.currentTime);
    const silentOsc = ctx.createOscillator();
    silentOsc.type = "sine";
    silentOsc.frequency.setValueAtTime(20, ctx.currentTime);
    silentOsc.connect(silentGain);
    silentGain.connect(ctx.destination);
    silentOsc.start(0);
    keepAliveStarted = true;
  } catch {
    // Ignore if blocked
  }
}

/**
 * Schedules and executes the signature crystalline favorite chime.
 * When `silent === true`, runs the entire synth graph at inaudible gain (0.000001)
 * to wake up the WebAudio algorithm in the background without producing audible sound.
 */
function executeChime(ctx: AudioContext, silent: boolean = false): void {
  try {
    const now = ctx.currentTime + 0.012;
    const peakGain = silent ? 0.000001 : 0.135;
    const harmonicGain = silent ? 0.000001 : 0.04;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.00001, now);
    masterGain.gain.linearRampToValueAtTime(peakGain, now + 0.016);
    masterGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.34);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2700, now);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.075); // E6

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1760, now); // A6
    osc2.frequency.exponentialRampToValueAtTime(2093, now + 0.075); // C7

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(harmonicGain, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.19);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.21);

    setTimeout(() => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        osc2Gain.disconnect();
        filter.disconnect();
        masterGain.disconnect();
      } catch {}
    }, 420);
  } catch {}
}

/**
 * Schedules and executes the luxury tactile "Add to Bag" chime.
 * When `silent === true`, runs the entire synth graph at inaudible gain (0.000001)
 * to wake up the WebAudio algorithm in the background without producing audible sound.
 */
function executeAddToCartChime(ctx: AudioContext, silent: boolean = false): void {
  try {
    const now = ctx.currentTime + 0.012;
    const scale = silent ? 0.00001 : 1;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3400, now);
    filter.Q.setValueAtTime(1.1, now);

    // 1. Organic tactile drop
    const popOsc = ctx.createOscillator();
    popOsc.type = "sine";
    popOsc.frequency.setValueAtTime(360, now);
    popOsc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.00001, now);
    popGain.gain.linearRampToValueAtTime(0.075 * scale, now + 0.006);
    popGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.05);

    // 2. Chime Note 1 (G5 -> C6)
    const t1 = now + 0.012;
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(784, t1);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, t1 + 0.045);

    const osc1Gain = ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.00001, t1);
    osc1Gain.gain.linearRampToValueAtTime(0.115 * scale, t1 + 0.012);
    osc1Gain.gain.exponentialRampToValueAtTime(0.00001, t1 + 0.22);

    // 3. Chime Note 2 (E6 -> G6)
    const t2 = now + 0.055;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.5, t2);
    osc2.frequency.exponentialRampToValueAtTime(1567.98, t2 + 0.05);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.00001, t2);
    osc2Gain.gain.linearRampToValueAtTime(0.135 * scale, t2 + 0.014);
    osc2Gain.gain.exponentialRampToValueAtTime(0.00001, t2 + 0.26);

    // 4. Shimmer harmonic (C7)
    const osc3 = ctx.createOscillator();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(2093, t2);
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.00001, t2);
    osc3Gain.gain.linearRampToValueAtTime(0.03 * scale, t2 + 0.01);
    osc3Gain.gain.exponentialRampToValueAtTime(0.00001, t2 + 0.16);

    popOsc.connect(popGain);
    popGain.connect(filter);
    osc1.connect(osc1Gain);
    osc1Gain.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc3.connect(osc3Gain);
    osc3Gain.connect(filter);
    filter.connect(ctx.destination);

    popOsc.start(now);
    popOsc.stop(now + 0.06);
    osc1.start(t1);
    osc1.stop(t1 + 0.24);
    osc2.start(t2);
    osc2.stop(t2 + 0.28);
    osc3.start(t2);
    osc3.stop(t2 + 0.18);

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
    }, 400);
  } catch {}
}

/**
 * Silent Background Pre-Warming Algorithm (`initSilentAudioEngine`)
 * Executes the sound synthesis functions in silent mode (`silent = true`) in the background
 * on website startup and on the earliest pointer/mouse/keyboard/touch capture phase.
 * This wakes up the WebAudio algorithm and hardware buffer so the VERY FIRST user action always plays!
 */
export function initSilentAudioEngine(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getOrCreateContext();
    if (!ctx) return;

    const runSilentPass = () => {
      try {
        ensureHardwareKeepAlive(ctx);
        // Run both sound graphs in silent mode to compile and prime the audio pipeline
        executeChime(ctx, true);
        executeAddToCartChime(ctx, true);
        isAudioWarmed = true;
      } catch {}
    };

    // 1. Immediate background execution attempt on startup
    runSilentPass();

    // 2. If browser suspended the context prior to gesture, resume & execute in capture phase
    // (Capture phase on pointerdown/mousedown runs BEFORE React's onClick bubble phase!)
    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          runSilentPass();
        })
        .catch(() => {});
    }
  } catch {}
}

export function warmAudioContext(): void {
  initSilentAudioEngine();
}

// Automatically attach capture-phase listeners on module load so the audio engine wakes up
// on the very first mouse movement, scroll, or pointerdown (before any click handler fires!)
if (typeof window !== "undefined") {
  // Run background silent pass immediately when script loads
  setTimeout(() => {
    initSilentAudioEngine();
  }, 10);

  const onCaptureWakeup = () => {
    const ctx = getOrCreateContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          ensureHardwareKeepAlive(ctx);
          executeChime(ctx, true);
          executeAddToCartChime(ctx, true);
          isAudioWarmed = true;
        })
        .catch(() => {});
    } else if (!isAudioWarmed) {
      ensureHardwareKeepAlive(ctx);
      executeChime(ctx, true);
      executeAddToCartChime(ctx, true);
      isAudioWarmed = true;
    }
  };

  window.addEventListener("pointerdown", onCaptureWakeup, { capture: true, passive: true });
  window.addEventListener("mousedown", onCaptureWakeup, { capture: true, passive: true });
  window.addEventListener("touchstart", onCaptureWakeup, { capture: true, passive: true });
  window.addEventListener("keydown", onCaptureWakeup, { capture: true, passive: true });
  window.addEventListener("mousemove", onCaptureWakeup, { capture: true, passive: true, once: true });
}

/**
 * Plays the signature Lumina Home favorite chime (works on 1st click and in guest mode).
 */
export function playFavoriteSound(): void {
  if (typeof window === "undefined") return;

  try {
    const ctx = getOrCreateContext();
    if (!ctx) return;

    ensureHardwareKeepAlive(ctx);

    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          // 25ms hardware DAC wakeup buffer so the 1st note is never clipped
          setTimeout(() => executeChime(ctx, false), 25);
        })
        .catch(() => {});
    } else {
      executeChime(ctx, false);
    }
  } catch {}
}

/**
 * Plays the signature Lumina Home Add-to-Bag tactile chime (works on 1st click and in guest mode).
 */
export function playAddToCartSound(): void {
  if (typeof window === "undefined") return;

  try {
    const ctx = getOrCreateContext();
    if (!ctx) return;

    ensureHardwareKeepAlive(ctx);

    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          setTimeout(() => executeAddToCartChime(ctx, false), 25);
        })
        .catch(() => {});
    } else {
      executeAddToCartChime(ctx, false);
    }
  } catch {}
}

/**
 * Subtle tactile mechanical tick for beUI Adaptive Stepper (+ / -) and pill switches.
 */
export function playStepperTickSound(direction: "up" | "down" = "up"): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getOrCreateContext();
    if (!ctx) return;
    ensureHardwareKeepAlive(ctx);

    const runTick = () => {
      const now = ctx.currentTime + 0.005;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const startFreq = direction === "up" ? 520 : 420;
      const endFreq = direction === "up" ? 780 : 290;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.032);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.048);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(runTick).catch(() => {});
    } else {
      runTick();
    }
  } catch {}
}

/**
 * Warm, low-mid frequency tactile sound for opening and closing the card envelope (CardFolder).
 * Uses frequencies between 180 Hz and 360 Hz with a 520 Hz low-pass filter so it is clearly audible
 * on all speakers while remaining 100% free of high-pitched/piercing tones.
 */
export function playCardEnvelopeSound(mode: "open" | "close"): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getOrCreateContext();
    if (!ctx) return;
    ensureHardwareKeepAlive(ctx);

    const executeSound = () => {
      const now = ctx.currentTime + 0.006;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(520, now);
      filter.Q.setValueAtTime(0.85, now);
      filter.connect(ctx.destination);

      if (mode === "open") {
        // Warm ascending two-note velvet/leather slide (185 Hz -> 275 Hz + soft 220 Hz body, ~210ms)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(185, now);
        osc1.frequency.exponentialRampToValueAtTime(293.66, now + 0.16); // F#3 -> D4 (warm low-mid)

        gain1.gain.setValueAtTime(0.0001, now);
        gain1.gain.linearRampToValueAtTime(0.22, now + 0.022);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(146.83, now + 0.02); // D3 warm foundation
        osc2.frequency.exponentialRampToValueAtTime(220, now + 0.18); // A3

        gain2.gain.setValueAtTime(0.0001, now + 0.02);
        gain2.gain.linearRampToValueAtTime(0.14, now + 0.045);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.23);

        // Soft paper/leather envelope friction swish (bandpass 310 Hz)
        const bufLen = Math.floor(ctx.sampleRate * 0.14);
        const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufLen) * Math.PI);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.setValueAtTime(310, now);
        band.Q.setValueAtTime(1.5, now);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        osc1.connect(gain1);
        gain1.connect(filter);
        osc2.connect(gain2);
        gain2.connect(filter);
        noise.connect(band);
        band.connect(noiseGain);
        noiseGain.connect(filter);

        osc1.start(now);
        osc1.stop(now + 0.23);
        osc2.start(now + 0.02);
        osc2.stop(now + 0.24);
        noise.start(now);
      } else {
        // Short, soft low-mid pocket close sound (260 Hz -> 155 Hz in 95ms)
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(155, now + 0.085);

        sub.type = "triangle";
        sub.frequency.setValueAtTime(165, now);
        sub.frequency.exponentialRampToValueAtTime(110, now + 0.085);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.20, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(filter);

        osc.start(now);
        sub.start(now);
        osc.stop(now + 0.10);
        sub.stop(now + 0.10);
      }
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(executeSound).catch(() => {});
    } else {
      executeSound();
    }
  } catch {}
}

