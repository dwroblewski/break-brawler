export class DebugPanel {
  constructor(gameCore, audioEngine) {
    this.gameCore = gameCore;
    this.audioEngine = audioEngine;
    this.visible = false;
    this.updateInterval = null;
    
    this.setupKeyboardShortcut();
    this.createPanel();
  }
  
  setupKeyboardShortcut() {
    // Press Ctrl+D to toggle debug panel
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
  
  createPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.9);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #0f0;
      min-width: 300px;
      z-index: 10000;
      display: none;
    `;
    
    panel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #0f0;">🔧 DEBUG PANEL</h3>
      <div id="debug-content"></div>
      <hr style="border-color: #0f0; margin: 10px 0;">
      <button onclick="window.runSystemTest()" style="
        background: #0f0;
        color: #000;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
        font-weight: bold;
      ">RUN SYSTEM TEST</button>
    `;
    
    document.body.appendChild(panel);
    this.panel = panel;
  }
  
  toggle() {
    this.visible = !this.visible;
    this.panel.style.display = this.visible ? 'block' : 'none';
    
    if (this.visible) {
      this.startUpdating();
    } else {
      this.stopUpdating();
    }
  }
  
  startUpdating() {
    this.update(); // Initial update
    this.updateInterval = setInterval(() => this.update(), 100);
  }
  
  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  update() {
    const content = document.getElementById('debug-content');
    if (!content) return;
    
    const beatPos = this.audioEngine.beatClock.getCurrentPosition();
    const transport = Tone.Transport;
    
    const debugInfo = {
      // Audio System
      'Audio Context': this.audioEngine.audioContext ? 'Active' : 'Inactive',
      'Sample Rate': this.audioEngine.audioContext?.sampleRate || 'N/A',
      'Base Latency': this.audioEngine.audioContext?.baseLatency?.toFixed(3) + 's' || 'N/A',
      'Output Latency': this.audioEngine.audioContext?.outputLatency?.toFixed(3) + 's' || 'N/A',
      
      // Transport
      'Transport State': transport.state,
      'Transport BPM': transport.bpm.value,
      'Transport Position': transport.position,
      
      // Beat Clock
      'Current Bar': beatPos.bar + 1,
      'Current Beat': beatPos.beat + 1,
      'Current Phrase': beatPos.phrase,
      'Drop Window': beatPos.isDropWindow ? '🟢 OPEN' : '🔴 CLOSED',
      'Time to Drop': this.audioEngine.beatClock.getTimeToNextDrop().toFixed(1) + 's',
      
      // Game State
      'Score': this.gameCore.score,
      'Combo': this.gameCore.combo,
      'Hype': this.gameCore.hype + '%',
      'Hit Count': this.gameCore.hitCount,
      'Session Time': ((Date.now() - this.gameCore.sessionStartTime) / 1000).toFixed(1) + 's',
      
      // Performance Metrics
      'Timing Samples': this.gameCore.timingAccuracy.length,
      'Avg Timing Error': this.gameCore.timingAccuracy.length > 0 
        ? (this.gameCore.timingAccuracy.reduce((a,b) => a+b, 0) / this.gameCore.timingAccuracy.length).toFixed(1) + 'ms'
        : 'N/A',
      'Flow Score': this.gameCore.flowScore,
      'Taste Score': this.gameCore.tasteScore,
      'Pattern Length': this.gameCore.patternHistory.length,
      
      // Active Features
      'Active Rolls': this.audioEngine.activeRolls.size,
      'Active Sources': this.audioEngine.activeSources.size,
      'Sidechain Level': this.audioEngine.sidechainAmount + 'dB',
      
      // First Sound
      'TTF Sound': this.audioEngine.firstSoundTime ? this.audioEngine.firstSoundTime + 'ms' : 'Not yet'
    };
    
    content.innerHTML = Object.entries(debugInfo)
      .map(([key, value]) => `<div><span style="color: #888;">${key}:</span> ${value}</div>`)
      .join('');
  }
}

// System test function
window.runSystemTest = function() {
  console.log('🧪 Running System Test...');
  
  const tests = [];
  const assert = (name, condition, details = '') => {
    tests.push({ name, passed: condition, details });
    console.log(condition ? '✅' : '❌', name, details);
  };
  
  // Get references
  const bb = window.breakBrawler;
  const audio = bb?.audioEngine;
  const game = bb?.gameCore;
  const clock = audio?.beatClock;
  
  // Core Systems
  assert('BreakBrawler Instance', !!bb);
  assert('AudioEngine Instance', !!audio);
  assert('GameCore Instance', !!game);
  assert('BeatClock Instance', !!clock);
  
  // Audio System
  assert('AudioContext Active', audio?.audioContext?.state === 'running');
  assert('Sample Buffers Loaded', audio?.sampleBuffers?.size === 6, `Loaded: ${audio?.sampleBuffers?.size}`);
  assert('Tone.js Initialized', Tone.context.state === 'running');
  assert('Transport Running', Tone.Transport.state === 'started');
  
  // Timing System
  assert('BPM Set Correctly', Tone.Transport.bpm.value === 172);
  assert('Beat Callbacks Set', !!clock?.onBeat || !!clock?.onBar);
  assert('Drop Window Detection', typeof clock?.isDropWindow === 'boolean');
  
  // Game Mechanics
  assert('Score System', typeof game?.score === 'number');
  assert('Combo System', typeof game?.combo === 'number');
  assert('Hype System', typeof game?.hype === 'number');
  assert('Session Tracking', !!game?.sessionStartTime);
  
  // Performance Tracking
  assert('Timing Accuracy Array', Array.isArray(game?.timingAccuracy));
  assert('Flow Score', typeof game?.flowScore === 'number');
  assert('Taste Score', typeof game?.tasteScore === 'number');
  assert('Pattern History', Array.isArray(game?.patternHistory));
  
  // UI Elements
  assert('Score Display', !!document.getElementById('score'));
  assert('Combo Display', !!document.getElementById('combo'));
  assert('Hype Meter', !!document.getElementById('hype-fill'));
  assert('Phrase Beads', document.querySelectorAll('.phrase-bead').length === 4);
  assert('Pad Grid', document.querySelectorAll('.pad').length === 6);
  
  // Calculate results
  const passed = tests.filter(t => t.passed).length;
  const total = tests.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log('━'.repeat(40));
  console.log(`Test Results: ${passed}/${total} passed (${percentage}%)`);
  
  if (percentage >= 90) {
    console.log('✅ SYSTEM VERIFICATION PASSED!');
    alert(`✅ System Test PASSED!\n${passed}/${total} tests passed (${percentage}%)`);
  } else {
    console.log('❌ SYSTEM VERIFICATION FAILED');
    const failed = tests.filter(t => !t.passed).map(t => t.name);
    console.log('Failed tests:', failed);
    alert(`❌ System Test FAILED!\n${passed}/${total} tests passed\n\nFailed:\n${failed.join('\n')}`);
  }
  
  return { tests, passed, total, percentage };
};