// Advanced sample generator for realistic break sounds
export class SampleGenerator {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.sampleRate = audioContext.sampleRate;
  }
  
  // Generate Amen-style break samples
  generateAmenPack() {
    return {
      name: 'Amen Break',
      bpm: 172,
      samples: {
        KICK: this.generateAmenKick(),
        SNARE: this.generateAmenSnare(),
        HAT: this.generateAmenHat(),
        GHOST: this.generateAmenGhost(),
        CRASH: this.generateAmenCrash(),
        RIDE: this.generateAmenRide()
      }
    };
  }
  
  // Generate Think-style break samples
  generateThinkPack() {
    return {
      name: 'Think Break',
      bpm: 172,
      samples: {
        KICK: this.generateThinkKick(),
        SNARE: this.generateThinkSnare(),
        HAT: this.generateThinkHat(),
        GHOST: this.generateThinkGhost(),
        CRASH: this.generateThinkCrash(),
        RIDE: this.generateThinkRide()
      }
    };
  }
  
  // Amen-style samples (punchy, vintage)
  generateAmenKick() {
    const duration = 0.5;
    const length = duration * this.sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.sampleRate;
      
      // Multi-layer kick
      // Sub layer (50-60Hz)
      const sub = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-25 * t);
      
      // Punch layer (100-150Hz)
      const punch = Math.sin(2 * Math.PI * 120 * t * (1 - t * 2)) * Math.exp(-35 * t);
      
      // Click transient
      const click = (Math.random() - 0.5) * Math.exp(-200 * t) * 2;
      
      // Vinyl character
      const vinyl = (Math.random() - 0.5) * 0.02;
      
      data[i] = (sub * 0.7 + punch * 0.5 + (t < 0.005 ? click : 0) + vinyl) * 0.9;
      
      // Soft clip for warmth
      data[i] = Math.tanh(data[i] * 1.5);
    }
    
    return this.createBuffer(data);
  }
  
  generateAmenSnare() {
    const duration = 0.25;
    const length = duration * this.sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.sampleRate;
      
      // Tone components (200Hz and 250Hz)
      const tone1 = Math.sin(2 * Math.PI * 200 * t);
      const tone2 = Math.sin(2 * Math.PI * 250 * t);
      const tones = (tone1 + tone2 * 0.7) * Math.exp(-30 * t);
      
      // Snare rattle (noise burst)
      const noise = (Math.random() - 0.5);
      const filteredNoise = this.highpass(noise, 400, t);
      const snares = filteredNoise * Math.exp(-25 * t);
      
      // Crispy transient
      const crack = t < 0.003 ? (Math.random() - 0.5) * 2 : 0;
      
      data[i] = (tones * 0.4 + snares * 0.8 + crack) * 0.8;
      
      // Vintage compression
      data[i] = Math.tanh(data[i] * 2) * 0.7;
    }
    
    return this.createBuffer(data);
  }
  
  generateAmenHat() {
    const duration = 0.08;
    const length = duration * this.sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.sampleRate;
      
      // Metallic frequencies (6-10kHz)
      let metallic = 0;
      for (let freq = 6000; freq < 10000; freq += 1000) {
        metallic += Math.sin(2 * Math.PI * freq * t + Math.random() * Math.PI);
      }
      
      // Filtered noise
      const noise = (Math.random() - 0.5);
      const filtered = this.highpass(noise, 8000, t);
      
      // Sharp envelope
      const env = Math.exp(-150 * t);
      
      data[i] = (metallic * 0.1 + filtered) * env * 0.6;
    }
    
    return this.createBuffer(data);
  }
  
  generateAmenGhost() {
    // Quieter, slightly different snare
    const snare = this.generateAmenSnare();
    const data = new Float32Array(snare.length);
    
    // Copy and modify
    snare.copyToChannel(data, 0);
    
    // Make it quieter and slightly different
    for (let i = 0; i < data.length; i++) {
      data[i] *= 0.4;
      // Add slight pitch shift effect
      if (i > 0) {
        data[i] = data[i] * 0.7 + data[i-1] * 0.3;
      }
    }
    
    return this.createBuffer(data);
  }
  
  generateAmenCrash() {
    const duration = 2.5;
    const length = duration * this.sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.sampleRate;
      
      // Multiple frequency bands
      let crash = 0;
      
      // Low shimmer (1-3kHz)
      for (let freq = 1000; freq < 3000; freq += 200) {
        crash += Math.sin(2 * Math.PI * freq * t + Math.random() * Math.PI * 2);
      }
      
      // High sizzle (4-12kHz)
      for (let freq = 4000; freq < 12000; freq += 500) {
        crash += Math.sin(2 * Math.PI * freq * t + Math.random() * Math.PI * 2) * 0.5;
      }
      
      // Noise layer
      const noise = (Math.random() - 0.5) * 0.5;
      
      // Complex envelope
      const attack = t < 0.05 ? t / 0.05 : 1;
      const decay = Math.exp(-0.5 * t);
      const env = attack * decay;
      
      data[i] = (crash * 0.1 + noise) * env * 0.7;
      
      // Soft saturation
      data[i] = Math.tanh(data[i] * 1.2);
    }
    
    return this.createBuffer(data);
  }
  
  generateAmenRide() {
    const duration = 0.8;
    const length = duration * this.sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.sampleRate;
      
      // Bell tone fundamentals
      const bell1 = Math.sin(2 * Math.PI * 320 * t);
      const bell2 = Math.sin(2 * Math.PI * 640 * t) * 0.6;
      const bell3 = Math.sin(2 * Math.PI * 950 * t) * 0.3;
      
      // Metallic overtones
      const metal = Math.sin(2 * Math.PI * 3200 * t) * 0.1;
      
      // Ping transient
      const ping = t < 0.01 ? Math.sin(2 * Math.PI * 2000 * t) : 0;
      
      // Envelope
      const env = Math.exp(-2.5 * t);
      
      data[i] = (bell1 + bell2 + bell3 + metal + ping) * env * 0.4;
    }
    
    return this.createBuffer(data);
  }
  
  // Think-style samples (funkier, more open)
  generateThinkKick() {
    const duration = 0.6;
    const length = duration * this.sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.sampleRate;
      
      // Deeper sub (45Hz)
      const sub = Math.sin(2 * Math.PI * 45 * t) * Math.exp(-20 * t);
      
      // Mid punch with slight pitch bend
      const pitchEnv = 80 * Math.exp(-50 * t);
      const punch = Math.sin(2 * Math.PI * (80 + pitchEnv) * t) * Math.exp(-30 * t);
      
      // Beater click
      const click = t < 0.003 ? Math.sin(2 * Math.PI * 1500 * t) : 0;
      
      data[i] = (sub * 0.8 + punch * 0.6 + click * 0.3) * 0.9;
      
      // Warmer saturation
      data[i] = Math.tanh(data[i] * 1.2);
    }
    
    return this.createBuffer(data);
  }
  
  generateThinkSnare() {
    const duration = 0.3;
    const length = duration * this.sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.sampleRate;
      
      // Funkier tone (180Hz and 220Hz)
      const tone1 = Math.sin(2 * Math.PI * 180 * t);
      const tone2 = Math.sin(2 * Math.PI * 220 * t);
      const tones = (tone1 + tone2) * Math.exp(-25 * t);
      
      // Looser snares
      const noise = (Math.random() - 0.5);
      const snares = this.highpass(noise, 300, t) * Math.exp(-20 * t);
      
      // Rim shot component
      const rim = t < 0.005 ? Math.sin(2 * Math.PI * 800 * t) * 2 : 0;
      
      data[i] = (tones * 0.5 + snares * 0.7 + rim * 0.3) * 0.8;
      
      // Looser compression
      data[i] = Math.tanh(data[i] * 1.5) * 0.8;
    }
    
    return this.createBuffer(data);
  }
  
  generateThinkHat() {
    const duration = 0.1;
    const length = duration * this.sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.sampleRate;
      
      // Slightly lower, chunkier hat
      let metallic = 0;
      for (let freq = 4000; freq < 8000; freq += 800) {
        metallic += Math.sin(2 * Math.PI * freq * t + Math.random() * Math.PI);
      }
      
      const noise = (Math.random() - 0.5);
      const filtered = this.highpass(noise, 6000, t);
      
      // Slightly longer envelope
      const env = Math.exp(-120 * t);
      
      data[i] = (metallic * 0.15 + filtered * 0.8) * env * 0.7;
    }
    
    return this.createBuffer(data);
  }
  
  generateThinkGhost() {
    const snare = this.generateThinkSnare();
    const data = new Float32Array(snare.length);
    snare.copyToChannel(data, 0);
    
    // Different processing for ghost
    for (let i = 0; i < data.length; i++) {
      data[i] *= 0.35;
      // Add slight filter sweep
      if (i > 10) {
        data[i] = data[i] * 0.6 + data[i-1] * 0.3 + data[i-10] * 0.1;
      }
    }
    
    return this.createBuffer(data);
  }
  
  generateThinkCrash() {
    // Similar to Amen but brighter
    const crash = this.generateAmenCrash();
    const data = new Float32Array(crash.length);
    crash.copyToChannel(data, 0);
    
    // Brighten it up
    for (let i = 1; i < data.length; i++) {
      const highFreq = Math.sin(2 * Math.PI * 8000 * (i / this.sampleRate)) * 0.05;
      data[i] = data[i] * 0.9 + highFreq * Math.exp(-0.3 * (i / this.sampleRate));
    }
    
    return this.createBuffer(data);
  }
  
  generateThinkRide() {
    const duration = 1.0;
    const length = duration * this.sampleRate;
    const data = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.sampleRate;
      
      // Warmer bell tones
      const bell1 = Math.sin(2 * Math.PI * 280 * t);
      const bell2 = Math.sin(2 * Math.PI * 560 * t) * 0.7;
      const bell3 = Math.sin(2 * Math.PI * 840 * t) * 0.4;
      const bell4 = Math.sin(2 * Math.PI * 1120 * t) * 0.2;
      
      // Wash
      const wash = (Math.random() - 0.5) * 0.1 * Math.exp(-1 * t);
      
      const env = Math.exp(-2 * t);
      
      data[i] = (bell1 + bell2 + bell3 + bell4 + wash) * env * 0.4;
    }
    
    return this.createBuffer(data);
  }
  
  // Helper functions
  createBuffer(data) {
    const buffer = this.audioContext.createBuffer(1, data.length, this.sampleRate);
    buffer.copyToChannel(data, 0);
    return buffer;
  }
  
  highpass(sample, freq, t) {
    // Simple high-pass filter simulation
    const cutoff = freq / this.sampleRate;
    return sample * cutoff;
  }
}