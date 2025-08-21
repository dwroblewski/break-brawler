import * as Tone from 'tone';

export class AudioEngine {
  constructor() {
    this.initialized = false;
    this.audioContext = null;
    this.sampleBuffers = new Map();
    this.activeSources = new Map();
    
    // Timing
    this.bpm = 172;
    this.quantization = 16; // 16th notes
    
    // Track first sound for TTF metric
    this.firstSoundTime = null;
    this.startTime = Date.now();
  }

  async initialize() {
    if (this.initialized) return;
    
    // Create audio context with optimal settings for iPad
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'interactive',
      sampleRate: 44100
    });
    
    // Initialize Tone.js with our context
    Tone.setContext(this.audioContext);
    Tone.Transport.bpm.value = this.bpm;
    
    // Create synthetic drum samples (for now)
    await this.createSyntheticSamples();
    
    this.initialized = true;
    console.log('AudioEngine initialized');
  }

  async createSyntheticSamples() {
    // Create simple synthetic drums using Web Audio
    const sampleRate = this.audioContext.sampleRate;
    const samples = {
      KICK: this.generateKick(sampleRate),
      SNARE: this.generateSnare(sampleRate),
      HAT: this.generateHat(sampleRate),
      GHOST: this.generateGhost(sampleRate),
      CRASH: this.generateCrash(sampleRate),
      RIDE: this.generateRide(sampleRate)
    };
    
    // Convert to audio buffers
    for (const [name, data] of Object.entries(samples)) {
      const buffer = this.audioContext.createBuffer(1, data.length, sampleRate);
      buffer.copyToChannel(data, 0);
      this.sampleBuffers.set(name, buffer);
    }
  }

  generateKick(sampleRate) {
    const duration = 0.5;
    const length = duration * sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Sine wave with pitch envelope
      const pitch = 60 * Math.exp(-35 * t);
      data[i] = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-10 * t);
      // Add click
      if (t < 0.005) {
        data[i] += (Math.random() - 0.5) * Math.exp(-100 * t);
      }
    }
    return data;
  }

  generateSnare(sampleRate) {
    const duration = 0.2;
    const length = duration * sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Mix of tone and noise
      const tone = Math.sin(2 * Math.PI * 200 * t);
      const noise = (Math.random() - 0.5);
      data[i] = (tone * 0.5 + noise) * Math.exp(-30 * t);
    }
    return data;
  }

  generateHat(sampleRate) {
    const duration = 0.05;
    const length = duration * sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // High frequency noise
      data[i] = (Math.random() - 0.5) * Math.exp(-100 * t);
    }
    return data;
  }

  generateGhost(sampleRate) {
    // Quieter snare
    const snare = this.generateSnare(sampleRate);
    return snare.map(s => s * 0.4);
  }

  generateCrash(sampleRate) {
    const duration = 2;
    const length = duration * sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Wide spectrum noise
      let sample = 0;
      for (let freq = 2000; freq < 10000; freq += 500) {
        sample += Math.sin(2 * Math.PI * freq * t + Math.random() * Math.PI);
      }
      data[i] = sample * 0.1 * Math.exp(-0.5 * t);
    }
    return data;
  }

  generateRide(sampleRate) {
    const duration = 0.5;
    const length = duration * sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Bell-like tone
      let sample = 0;
      sample += Math.sin(2 * Math.PI * 350 * t);
      sample += Math.sin(2 * Math.PI * 580 * t) * 0.5;
      sample += Math.sin(2 * Math.PI * 900 * t) * 0.3;
      data[i] = sample * 0.3 * Math.exp(-2 * t);
    }
    return data;
  }

  playSlice(padId, velocity = 1.0) {
    if (!this.initialized) return;
    
    // Track first sound time
    if (!this.firstSoundTime) {
      this.firstSoundTime = Date.now() - this.startTime;
      console.log(`TTF Sound: ${this.firstSoundTime}ms`);
      // Emit telemetry event
      window.dispatchEvent(new CustomEvent('telemetry', {
        detail: { event: 'ttf_sound', time: this.firstSoundTime }
      }));
    }
    
    // Map pad number to sample name
    const sampleMap = {
      1: 'KICK', 2: 'SNARE', 3: 'HAT',
      4: 'GHOST', 5: 'CRASH', 6: 'RIDE'
    };
    
    const sampleName = sampleMap[padId];
    const buffer = this.sampleBuffers.get(sampleName);
    
    if (!buffer) return;
    
    // Stop previous instance if playing
    this.stopSlice(padId);
    
    // Create and play new source
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = velocity;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start(0);
    this.activeSources.set(padId, source);
    
    // Clean up when done
    source.onended = () => {
      this.activeSources.delete(padId);
    };
  }

  stopSlice(padId) {
    const source = this.activeSources.get(padId);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
      this.activeSources.delete(padId);
    }
  }

  startRoll(padId, rate = 16) {
    // TODO: Implement roll with Tone.js Transport
    console.log(`Roll started on pad ${padId} at 1/${rate}`);
  }

  stopRoll(padId) {
    console.log(`Roll stopped on pad ${padId}`);
  }

  triggerDrop(hypeLevel) {
    console.log(`Drop triggered with hype: ${hypeLevel}`);
    // TODO: Implement drop with sidechain
  }
}