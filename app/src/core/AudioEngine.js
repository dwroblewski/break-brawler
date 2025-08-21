import * as Tone from 'tone';
import { BeatClock } from './BeatClock.js';
import { SampleGenerator } from './SampleGenerator.js';

export class AudioEngine {
  constructor() {
    this.initialized = false;
    this.audioContext = null;
    this.sampleBuffers = new Map();
    this.activeSources = new Map();
    
    // Sample packs
    this.samplePacks = new Map();
    this.currentPack = 'amen'; // Default pack
    this.sampleGenerator = null;
    
    // Timing
    this.bpm = 172;
    this.quantization = 16; // 16th notes
    this.beatClock = new BeatClock(this.bpm);
    
    // Roll state
    this.activeRolls = new Map();
    
    // Sidechain compression
    this.masterGain = null;
    this.compressor = null;
    this.sidechainAmount = 6; // dB (Classic)
    
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
    
    // Create audio chain: source -> compressor -> masterGain -> destination
    this.setupAudioChain();
    
    // Initialize sample generator
    this.sampleGenerator = new SampleGenerator(this.audioContext);
    
    // Load sample packs
    await this.loadSamplePacks();
    
    // Start the beat clock
    this.beatClock.start();
    
    this.initialized = true;
    console.log('AudioEngine initialized');
  }
  
  setupAudioChain() {
    // Create master gain for overall volume control
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 1.0;
    
    // Create compressor for sidechain effect
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    
    // Connect chain
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);
  }

  async loadSamplePacks() {
    // Generate Amen break pack
    const amenPack = this.sampleGenerator.generateAmenPack();
    this.samplePacks.set('amen', amenPack);
    
    // Generate Think break pack
    const thinkPack = this.sampleGenerator.generateThinkPack();
    this.samplePacks.set('think', thinkPack);
    
    // Set initial pack
    this.switchPack(this.currentPack);
    
    console.log('Sample packs loaded: Amen, Think');
  }
  
  switchPack(packName) {
    const pack = this.samplePacks.get(packName);
    if (!pack) {
      console.error(`Sample pack '${packName}' not found`);
      return;
    }
    
    this.currentPack = packName;
    
    // Clear current samples
    this.sampleBuffers.clear();
    
    // Load new pack samples
    for (const [name, buffer] of Object.entries(pack.samples)) {
      this.sampleBuffers.set(name, buffer);
    }
    
    console.log(`Switched to ${pack.name} (${packName})`);
    
    // Emit pack change event
    window.dispatchEvent(new CustomEvent('packChanged', {
      detail: { packName, packDisplayName: pack.name }
    }));
  }
  
  getAvailablePacks() {
    return Array.from(this.samplePacks.keys());
  }
  
  getCurrentPack() {
    return this.currentPack;
  }


  playSlice(padId, velocity = 1.0, time = null) {
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
    
    // Stop previous instance if playing (only for immediate plays)
    if (!time) {
      this.stopSlice(padId);
    }
    
    // Create and play new source
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = velocity;
    
    // Connect through our audio chain
    source.connect(gainNode);
    gainNode.connect(this.compressor); // Go through compressor for sidechain
    
    // Schedule or play immediately
    if (time) {
      source.start(time);
    } else {
      source.start(0);
      this.activeSources.set(padId, source);
    }
    
    // Clean up when done
    source.onended = () => {
      if (!time) {
        this.activeSources.delete(padId);
      }
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
    // Stop any existing roll on this pad
    this.stopRoll(padId);
    
    // Calculate interval based on rate (16th, 32nd, 64th notes)
    const interval = `${rate}n`;
    
    // Schedule repeating hits with Transport
    const rollId = Tone.Transport.scheduleRepeat((time) => {
      // Play with slightly reduced velocity for rolls
      this.playSlice(padId, 0.7, time);
    }, interval);
    
    this.activeRolls.set(padId, rollId);
    console.log(`Roll started on pad ${padId} at 1/${rate}`);
  }

  stopRoll(padId) {
    const rollId = this.activeRolls.get(padId);
    if (rollId !== undefined) {
      Tone.Transport.clear(rollId);
      this.activeRolls.delete(padId);
      console.log(`Roll stopped on pad ${padId}`);
    }
  }

  triggerDrop(hypeLevel) {
    if (!this.beatClock.isDropWindow) {
      console.log('Drop missed - not in window!');
      return false;
    }
    
    console.log(`DROP! Hype: ${hypeLevel}, Sidechain: ${this.sidechainAmount}dB`);
    
    // Create a sub bass hit for the drop
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Sub bass frequency
    osc.frequency.value = 55; // Low A
    osc.type = 'sine';
    
    // Envelope for punch
    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.01); // Fast attack
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Decay
    
    // Connect
    osc.connect(gain);
    gain.connect(this.audioContext.destination); // Direct to output for impact
    
    // Play
    osc.start(now);
    osc.stop(now + 0.5);
    
    // Apply sidechain duck to all other audio
    this.applySidechain();
    
    // Play a crash cymbal
    this.playSlice(5, 1.0);
    
    return true;
  }
  
  applySidechain() {
    const now = this.audioContext.currentTime;
    const duckAmount = this.sidechainAmount / 20; // Convert dB to linear
    
    // Duck the master gain
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(1 - duckAmount, now + 0.01); // Fast duck
    this.masterGain.gain.linearRampToValueAtTime(1, now + 0.3); // Release
  }
  
  setSidechainAmount(type) {
    const amounts = {
      'Light': 4,
      'Classic': 6,
      'Heavy': 8
    };
    this.sidechainAmount = amounts[type] || 6;
  }
}