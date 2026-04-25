const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playClick() {
  playTone(800, 0.06, 'sine', 0.05);
}

export function playSlotFill() {
  playTone(600, 0.08, 'sine', 0.04);
}

export function playSubmit() {
  playTone(440, 0.1, 'triangle', 0.06);
  setTimeout(() => playTone(660, 0.1, 'triangle', 0.06), 80);
}

export function playPegReveal() {
  playTone(880, 0.12, 'sine', 0.04);
}

export function playWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.08), i * 120);
  });
}

export function playLose() {
  playTone(300, 0.4, 'sawtooth', 0.05);
  setTimeout(() => playTone(200, 0.6, 'sawtooth', 0.04), 200);
}

export function playHint() {
  playTone(1000, 0.15, 'sine', 0.05);
  setTimeout(() => playTone(1200, 0.15, 'sine', 0.05), 100);
}
