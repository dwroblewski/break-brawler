// Break Brawler - Main Entry Point
import { AudioEngine } from './core/AudioEngine.js';
import { InputController } from './core/InputController.js';
import { GameCore } from './core/GameCore.js';

class BreakBrawler {
  constructor() {
    this.audioEngine = new AudioEngine();
    this.gameCore = null;
    this.inputController = null;
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
      this.gameCore = new GameCore(this.audioEngine);
      
      // Setup input controller
      this.inputController = new InputController((action) => {
        this.gameCore.handleAction(action);
      });
      
      this.initialized = true;
      
      // Hide loading, show game
      this.hideLoading();
      this.showGame();
      
      // Start animation loop
      this.animate();
      
      console.log('Break Brawler ready!');
      
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

  animatePhraseBeads() {
    const beads = document.querySelectorAll('.phrase-bead');
    const bpm = this.audioEngine.bpm;
    const beatDuration = 60000 / bpm; // ms per beat
    const barDuration = beatDuration * 4; // 4 beats per bar
    
    let currentBead = 0;
    
    setInterval(() => {
      beads.forEach((bead, i) => {
        bead.classList.toggle('active', i === currentBead);
      });
      currentBead = (currentBead + 1) % beads.length;
    }, barDuration);
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