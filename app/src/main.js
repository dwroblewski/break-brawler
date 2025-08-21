// Break Brawler - Main Entry Point
import { AudioEngine } from './core/AudioEngine.js';
import { InputController } from './core/InputController.js';
import { GameCore } from './core/GameCore.js';
import { DebugPanel } from './core/DebugPanel.js';
import { ClipRecorder } from './core/ClipRecorder.js';
import { VisualFX } from './core/VisualFX.js';

class BreakBrawler {
  constructor() {
    this.audioEngine = new AudioEngine();
    this.gameCore = null;
    this.inputController = null;
    this.debugPanel = null;
    this.clipRecorder = null;
    this.visualFX = new VisualFX();
    this.initialized = false;
    
    this.setupUI();
  }

  setupUI() {
    // Add start screen
    const startScreen = document.createElement('div');
    startScreen.id = 'start-screen';
    startScreen.innerHTML = `
      <div class="start-content">
        <h1>Break Brawler</h1>
        <p>Drum'n'Bass Arcade</p>
        <button id="start-button" class="pulse">TAP TO START</button>
        <p class="hint">Keyboard: A S D / J K L • Space for Drop</p>
      </div>
    `;
    document.body.appendChild(startScreen);
    
    // Start button - required for iOS audio
    document.getElementById('start-button').addEventListener('click', () => {
      this.initialize();
    });
    
    // Also allow any key to start
    document.addEventListener('keydown', (e) => {
      if (!this.initialized && e.key === ' ') {
        this.initialize();
      }
    }, { once: true });
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('Initializing Break Brawler...');
    
    // Hide start screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
      startScreen.style.opacity = '0';
      setTimeout(() => startScreen.remove(), 500);
    }
    
    // Show loading
    this.showLoading();
    
    try {
      // Initialize audio (required user gesture for iOS)
      await this.audioEngine.initialize();
      
      // Create game core
      this.gameCore = new GameCore(this.audioEngine, this.visualFX);
      
      // Setup input controller
      this.inputController = new InputController((action) => {
        this.gameCore.handleAction(action);
      });
      
      // Create debug panel (hidden by default)
      this.debugPanel = new DebugPanel(this.gameCore, this.audioEngine);
      
      // Initialize clip recorder
      this.clipRecorder = new ClipRecorder(this.audioEngine);
      
      // Setup pack selector
      this.setupPackSelector();
      
      // Setup clip recording events
      this.setupClipEvents();
      
      this.initialized = true;
      
      // Hide loading, show game
      this.hideLoading();
      this.showGame();
      
      // Start animation loop
      this.animate();
      
      console.log('Break Brawler ready!');
      console.log('Press Ctrl+D to toggle debug panel');
      
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.showError('Failed to initialize audio. Please refresh and try again.');
    }
  }

  showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.innerHTML = '<div class="spinner"></div><p>Loading beats...</p>';
    document.body.appendChild(loading);
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => loading.remove(), 300);
    }
  }

  showGame() {
    const app = document.getElementById('app');
    app.style.display = 'block';
    app.style.opacity = '0';
    
    // Fade in
    requestAnimationFrame(() => {
      app.style.transition = 'opacity 0.5s';
      app.style.opacity = '1';
    });
    
    // Add phrase beads animation
    this.animatePhraseBeads();
  }

  showError(message) {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    document.body.appendChild(error);
  }
  
  setupPackSelector() {
    const packSelect = document.getElementById('pack-select');
    if (!packSelect) return;
    
    // Set initial value
    packSelect.value = this.audioEngine.getCurrentPack();
    
    // Handle pack changes
    packSelect.addEventListener('change', (e) => {
      const newPack = e.target.value;
      this.audioEngine.switchPack(newPack);
      
      // Visual feedback
      packSelect.style.borderColor = '#4dabf7';
      packSelect.style.boxShadow = '0 0 20px rgba(77,171,247,0.6)';
      
      setTimeout(() => {
        packSelect.style.borderColor = '';
        packSelect.style.boxShadow = '';
      }, 300);
    });
    
    // Listen for pack change events
    window.addEventListener('packChanged', (e) => {
      const { packName, packDisplayName } = e.detail;
      console.log(`Break pack changed to: ${packDisplayName}`);
      
      // Show temporary feedback
      this.showPackChangeFeedback(packDisplayName);
    });
  }
  
  showPackChangeFeedback(packName) {
    const feedback = document.createElement('div');
    feedback.className = 'pack-change-feedback';
    feedback.textContent = packName;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #4dabf7, #69db7c);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: bold;
      z-index: 1000;
      animation: pack-change 2s ease-out forwards;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pack-change {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
      feedback.remove();
      style.remove();
    }, 2000);
  }
  
  setupClipEvents() {
    // Listen for clip ready events
    window.addEventListener('clipReady', (e) => {
      console.log('Clip ready for use:', e.detail);
    });
    
    // Listen for recording started events
    window.addEventListener('recordingStarted', (e) => {
      this.showRecordingIndicator();
    });
    
    // Auto-start recording on first hit with hype > 25%
    let hasStartedRecording = false;
    this.gameCore.onHypeChange = (hypeLevel) => {
      if (!hasStartedRecording && hypeLevel > 25 && this.gameCore.hitCount > 5) {
        hasStartedRecording = true;
        this.clipRecorder.startRecording();
      }
    };
  }
  
  showRecordingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'recording-indicator';
    indicator.innerHTML = '🔴 REC';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: bold;
      z-index: 1000;
      animation: pulse 1s infinite;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(indicator);
    
    // Remove after 20 seconds (recording duration)
    setTimeout(() => {
      indicator.remove();
      style.remove();
    }, 20000);
  }

  animatePhraseBeads() {
    // Use the beat clock for accurate timing
    this.audioEngine.beatClock.onBar = (barNum) => {
      const beads = document.querySelectorAll('.phrase-bead');
      const currentBead = barNum % 4; // 4 bars per phrase
      
      beads.forEach((bead, i) => {
        bead.classList.toggle('active', i === currentBead);
      });
    };
    
    // Also track beats within the bar
    this.audioEngine.beatClock.onBeat = (beatNum) => {
      // Visual pulse on beat 1
      if (beatNum === 0) {
        const pads = document.querySelectorAll('.pad');
        pads.forEach(pad => {
          pad.style.transform = 'scale(1.05)';
          setTimeout(() => {
            pad.style.transform = 'scale(1)';
          }, 100);
        });
      }
    };
  }

  animate() {
    // Visual feedback animations
    requestAnimationFrame(() => this.animate());
    
    // Pulse pads on the beat (visual metronome)
    const now = Date.now();
    const bpm = this.audioEngine.bpm;
    const beatDuration = 60000 / bpm;
    const beatPhase = (now % beatDuration) / beatDuration;
    
    // Subtle pulse on all pads
    const pads = document.querySelectorAll('.pad');
    pads.forEach(pad => {
      const scale = 1 + Math.sin(beatPhase * Math.PI * 2) * 0.02;
      pad.style.transform = `scale(${scale})`;
    });
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  console.log('Break Brawler v0.1 - Loading...');
  window.breakBrawler = new BreakBrawler();
});