import * as Tone from 'tone';

export class BeatClock {
  constructor(bpm = 172) {
    this.bpm = bpm;
    this.beatsPerBar = 4;
    this.barsPerPhrase = 4;
    
    // Current position
    this.currentBar = 0;
    this.currentBeat = 0;
    this.currentPhrase = 0;
    
    // Drop window tracking
    this.isDropWindow = false;
    this.dropWindowStart = 0;
    this.dropWindowEnd = 0;
    
    // Callbacks
    this.onBeat = null;
    this.onBar = null;
    this.onPhrase = null;
    this.onDropWindow = null;
    
    // Schedule ahead for smooth updates
    this.lookahead = 0.1; // 100ms
    
    this.setupTransport();
  }
  
  setupTransport() {
    // Configure Tone.Transport
    Tone.Transport.bpm.value = this.bpm;
    Tone.Transport.timeSignature = this.beatsPerBar;
    
    // Schedule beat callback
    Tone.Transport.scheduleRepeat((time) => {
      this.handleBeat(time);
    }, "4n"); // Quarter note = 1 beat
    
    // Schedule bar callback
    Tone.Transport.scheduleRepeat((time) => {
      this.handleBar(time);
    }, "1m"); // 1 measure = 1 bar
  }
  
  async start() {
    // Start Tone.js if needed
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    Tone.Transport.start();
    console.log(`BeatClock started at ${this.bpm} BPM`);
  }
  
  stop() {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.currentBar = 0;
    this.currentBeat = 0;
    this.currentPhrase = 0;
  }
  
  handleBeat(time) {
    this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
    
    // Check for drop window (beat 4 of every 4th bar)
    const isLastBeatOfPhrase = 
      this.currentBeat === 3 && // Beat 4 (0-indexed)
      this.currentBar % this.barsPerPhrase === 3; // Bar 4 of phrase
    
    if (isLastBeatOfPhrase) {
      this.openDropWindow(time);
    }
    
    // Close drop window after 1 bar
    if (this.isDropWindow && Tone.now() > this.dropWindowEnd) {
      this.closeDropWindow();
    }
    
    if (this.onBeat) {
      this.onBeat(this.currentBeat, time);
    }
  }
  
  handleBar(time) {
    this.currentBar = (this.currentBar + 1) % (this.barsPerPhrase * 4); // Track up to 16 bars
    
    // Check for new phrase
    if (this.currentBar % this.barsPerPhrase === 0) {
      this.currentPhrase++;
      if (this.onPhrase) {
        this.onPhrase(this.currentPhrase, time);
      }
    }
    
    if (this.onBar) {
      this.onBar(this.currentBar, time);
    }
  }
  
  openDropWindow(time) {
    this.isDropWindow = true;
    this.dropWindowStart = time;
    // Window stays open for 1 bar
    const barDuration = (60 / this.bpm) * this.beatsPerBar;
    this.dropWindowEnd = time + barDuration;
    
    console.log('Drop window OPEN');
    
    if (this.onDropWindow) {
      this.onDropWindow(true, time);
    }
  }
  
  closeDropWindow() {
    this.isDropWindow = false;
    console.log('Drop window CLOSED');
    
    if (this.onDropWindow) {
      this.onDropWindow(false, Tone.now());
    }
  }
  
  getCurrentPosition() {
    return {
      bar: this.currentBar,
      beat: this.currentBeat,
      phrase: this.currentPhrase,
      isDropWindow: this.isDropWindow
    };
  }
  
  // Get time until next drop window
  getTimeToNextDrop() {
    if (this.isDropWindow) return 0;
    
    const currentTotalBeats = this.currentBar * this.beatsPerBar + this.currentBeat;
    const nextDropBeat = Math.ceil(currentTotalBeats / 16) * 16 - 1; // Beat before next phrase
    const beatsUntilDrop = nextDropBeat - currentTotalBeats;
    
    return (beatsUntilDrop * 60) / this.bpm;
  }
}