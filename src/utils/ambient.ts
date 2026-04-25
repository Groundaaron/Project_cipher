const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

export type AmbientTheme = 'rain' | 'forest' | 'space';

interface AmbientLayer {
  source: AudioBufferSourceNode | OscillatorNode;
  gain: GainNode;
  panner?: StereoPannerNode;
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let layers: AmbientLayer[] = [];
let noiseBuffer: AudioBuffer | null = null;
let isPlaying = false;
let currentTheme: AmbientTheme = 'rain';
let currentVolume = 0.3;
let currentIntensity = 0; // 0 = calm, 1 = tense
let targetIntensity = 0;
let intensityRaf: number | null = null;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const size = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, size, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
  }
  return buffer;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = createNoiseBuffer(ctx, 4);
  }
  return noiseBuffer;
}

function createLoopingSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = buffer.duration;
  return source;
}

function createFilteredNoise(ctx: AudioContext, filterType: BiquadFilterType, freq: number, q: number, buffer: AudioBuffer): { source: AudioBufferSourceNode; filter: BiquadFilterNode } {
  const source = createLoopingSource(ctx, buffer);
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  filter.Q.value = q;
  source.connect(filter);
  return { source, filter };
}

function createPad(ctx: AudioContext, freq: number, detune: number): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.detune.value = detune;
  return osc;
}

function stopAllLayers() {
  for (const layer of layers) {
    try {
      if (layer.source instanceof AudioBufferSourceNode) {
        layer.source.stop();
      } else {
        layer.source.stop();
      }
      layer.gain.disconnect();
      layer.panner?.disconnect();
    } catch {}
  }
  layers = [];
}

function buildRainTheme(ctx: AudioContext, master: GainNode, buffer: AudioBuffer): AmbientLayer[] {
  const result: AmbientLayer[] = [];

  // Rain: filtered white noise (bandpass ~2000Hz for rain texture)
  const rain = createFilteredNoise(ctx, 'bandpass', 2000, 0.5, buffer);
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.15;
  const rainPanner = ctx.createStereoPanner();
  rainPanner.pan.value = -0.2;
  rain.filter.connect(rainGain);
  rainGain.connect(rainPanner);
  rainPanner.connect(master);
  rain.source.start();
  result.push({ source: rain.source, gain: rainGain, panner: rainPanner });

  // Distant rumble: low-pass noise
  const rumble = createFilteredNoise(ctx, 'lowpass', 150, 1, buffer);
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.06;
  const rumblePanner = ctx.createStereoPanner();
  rumblePanner.pan.value = 0.3;
  rumble.filter.connect(rumbleGain);
  rumbleGain.connect(rumblePanner);
  rumblePanner.connect(master);
  rumble.source.start();
  result.push({ source: rumble.source, gain: rumbleGain, panner: rumblePanner });

  // Soft pad: low sine chord
  const pad1 = createPad(ctx, 110, 0);
  const pad1Gain = ctx.createGain();
  pad1Gain.gain.value = 0.03;
  pad1.connect(pad1Gain);
  pad1Gain.connect(master);
  pad1.start();
  result.push({ source: pad1, gain: pad1Gain });

  const pad2 = createPad(ctx, 165, 5);
  const pad2Gain = ctx.createGain();
  pad2Gain.gain.value = 0.02;
  pad2.connect(pad2Gain);
  pad2Gain.connect(master);
  pad2.start();
  result.push({ source: pad2, gain: pad2Gain });

  // High shimmer: very quiet high-pass noise
  const shimmer = createFilteredNoise(ctx, 'highpass', 6000, 0.3, buffer);
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.02;
  shimmer.filter.connect(shimmerGain);
  shimmerGain.connect(master);
  shimmer.source.start();
  result.push({ source: shimmer.source, gain: shimmerGain });

  return result;
}

function buildForestTheme(ctx: AudioContext, master: GainNode, buffer: AudioBuffer): AmbientLayer[] {
  const result: AmbientLayer[] = [];

  // Wind: low-pass noise with slow modulation
  const wind = createFilteredNoise(ctx, 'lowpass', 400, 0.7, buffer);
  const windGain = ctx.createGain();
  windGain.gain.value = 0.1;
  const windPanner = ctx.createStereoPanner();
  windPanner.pan.value = 0.4;
  wind.filter.connect(windGain);
  windGain.connect(windPanner);
  windPanner.connect(master);
  wind.source.start();
  result.push({ source: wind.source, gain: windGain, panner: windPanner });

  // Leaves rustle: bandpass noise
  const leaves = createFilteredNoise(ctx, 'bandpass', 3500, 0.3, buffer);
  const leavesGain = ctx.createGain();
  leavesGain.gain.value = 0.04;
  const leavesPanner = ctx.createStereoPanner();
  leavesPanner.pan.value = -0.5;
  leaves.filter.connect(leavesGain);
  leavesGain.connect(leavesPanner);
  leavesPanner.connect(master);
  leaves.source.start();
  result.push({ source: leaves.source, gain: leavesGain, panner: leavesPanner });

  // Night drone: low pad
  const drone = createPad(ctx, 82, 0);
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.025;
  drone.connect(droneGain);
  droneGain.connect(master);
  drone.start();
  result.push({ source: drone, gain: droneGain });

  const drone2 = createPad(ctx, 123, -3);
  const drone2Gain = ctx.createGain();
  drone2Gain.gain.value = 0.018;
  drone2.connect(drone2Gain);
  drone2Gain.connect(master);
  drone2.start();
  result.push({ source: drone2, gain: drone2Gain });

  // Cricket-like: high filtered noise
  const crickets = createFilteredNoise(ctx, 'bandpass', 5500, 5, buffer);
  const cricketsGain = ctx.createGain();
  cricketsGain.gain.value = 0.012;
  const cricketsPanner = ctx.createStereoPanner();
  cricketsPanner.pan.value = -0.6;
  crickets.filter.connect(cricketsGain);
  cricketsGain.connect(cricketsPanner);
  cricketsPanner.connect(master);
  crickets.source.start();
  result.push({ source: crickets.source, gain: cricketsGain, panner: cricketsPanner });

  return result;
}

function buildSpaceTheme(ctx: AudioContext, master: GainNode, buffer: AudioBuffer): AmbientLayer[] {
  const result: AmbientLayer[] = [];

  // Deep hum: very low sine
  const hum = createPad(ctx, 55, 0);
  const humGain = ctx.createGain();
  humGain.gain.value = 0.04;
  hum.connect(humGain);
  humGain.connect(master);
  hum.start();
  result.push({ source: hum, gain: humGain });

  // Ethereal pad: fifth interval
  const pad1 = createPad(ctx, 82, 7);
  const pad1Gain = ctx.createGain();
  pad1Gain.gain.value = 0.025;
  const pad1Panner = ctx.createStereoPanner();
  pad1Panner.pan.value = -0.3;
  pad1.connect(pad1Gain);
  pad1Gain.connect(pad1Panner);
  pad1Panner.connect(master);
  pad1.start();
  result.push({ source: pad1, gain: pad1Gain, panner: pad1Panner });

  const pad2 = createPad(ctx, 123, -5);
  const pad2Gain = ctx.createGain();
  pad2Gain.gain.value = 0.02;
  const pad2Panner = ctx.createStereoPanner();
  pad2Panner.pan.value = 0.3;
  pad2.connect(pad2Gain);
  pad2Gain.connect(pad2Panner);
  pad2Panner.connect(master);
  pad2.start();
  result.push({ source: pad2, gain: pad2Gain, panner: pad2Panner });

  // Cosmic noise: very quiet high-pass
  const cosmic = createFilteredNoise(ctx, 'highpass', 3000, 0.2, buffer);
  const cosmicGain = ctx.createGain();
  cosmicGain.gain.value = 0.015;
  cosmic.filter.connect(cosmicGain);
  cosmicGain.connect(master);
  cosmic.source.start();
  result.push({ source: cosmic.source, gain: cosmicGain });

  // Sub bass pulse
  const sub = createPad(ctx, 36, 0);
  const subGain = ctx.createGain();
  subGain.gain.value = 0.02;
  sub.connect(subGain);
  subGain.connect(master);
  sub.start();
  result.push({ source: sub, gain: subGain });

  return result;
}

const THEME_BUILDERS: Record<AmbientTheme, (ctx: AudioContext, master: GainNode, buffer: AudioBuffer) => AmbientLayer[]> = {
  rain: buildRainTheme,
  forest: buildForestTheme,
  space: buildSpaceTheme,
};

// Base gain values per layer index for each theme (for intensity scaling)
const BASE_GAINS: Record<AmbientTheme, number[]> = {
  rain: [0.15, 0.06, 0.03, 0.02, 0.02],
  forest: [0.1, 0.04, 0.025, 0.018, 0.012],
  space: [0.04, 0.025, 0.02, 0.015, 0.02],
};

// Intensity multipliers per layer (how much they increase during tense moments)
const INTENSITY_MULTS: Record<AmbientTheme, number[]> = {
  rain: [1.4, 1.8, 1.2, 1.3, 1.5],
  forest: [1.5, 1.3, 1.2, 1.2, 1.6],
  space: [1.3, 1.4, 1.5, 1.6, 1.2],
};

function updateIntensity() {
  const ctx = getCtx();
  if (!ctx || !isPlaying) return;

  // Smoothly interpolate current toward target
  currentIntensity += (targetIntensity - currentIntensity) * 0.02;
  if (Math.abs(currentIntensity - targetIntensity) < 0.001) {
    currentIntensity = targetIntensity;
  }

  const bases = BASE_GAINS[currentTheme];
  const mults = INTENSITY_MULTS[currentTheme];

  for (let i = 0; i < layers.length && i < bases.length; i++) {
    const base = bases[i];
    const mult = mults[i];
    const target = base * (1 + (mult - 1) * currentIntensity) * currentVolume;
    layers[i].gain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
  }

  intensityRaf = requestAnimationFrame(updateIntensity);
}

export function startAmbient(theme: AmbientTheme, volume: number) {
  const ctx = getCtx();
  if (!ctx) return;

  stopAllLayers();
  if (intensityRaf) cancelAnimationFrame(intensityRaf);

  currentTheme = theme;
  currentVolume = volume;
  currentIntensity = 0;
  targetIntensity = 0;

  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5);
  masterGain.connect(ctx.destination);

  const buffer = getNoiseBuffer(ctx);
  const builder = THEME_BUILDERS[theme];
  layers = builder(ctx, masterGain, buffer);

  isPlaying = true;
  intensityRaf = requestAnimationFrame(updateIntensity);
}

export function stopAmbient() {
  const ctx = getCtx();
  if (!ctx || !isPlaying) return;

  if (intensityRaf) {
    cancelAnimationFrame(intensityRaf);
    intensityRaf = null;
  }

  // Fade out over 1.5s
  masterGain?.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

  setTimeout(() => {
    stopAllLayers();
    masterGain?.disconnect();
    masterGain = null;
    isPlaying = false;
  }, 1600);
}

export function setAmbientVolume(volume: number) {
  currentVolume = volume;
}

export function setAmbientIntensity(intensity: number) {
  targetIntensity = Math.max(0, Math.min(1, intensity));
}

export function isAmbientPlaying(): boolean {
  return isPlaying;
}

export function switchTheme(theme: AmbientTheme) {
  if (theme === currentTheme && isPlaying) return;
  currentTheme = theme;
  if (isPlaying) {
    startAmbient(theme, currentVolume);
  }
}
