export class GameCore {
  constructor(audioEngine, visualFX = null) {
    this.audioEngine = audioEngine;
    this.visualFX = visualFX;
    
    // Game state
    this.score = 0;
    this.combo = 0;
    this.hype = 0;
    this.maxHype = 100;
    this.isRunning = true;
    
    // Timing state
    this.lastHitTime = 0;
    this.perfectWindow = 35; // ms (Expert)
    this.goodWindow = 60; // ms (Normal)
    this.okWindow = 90; // ms (Easy)
    
    // Assist mode
    this.assistLevel = 'Easy';
    
    // Session tracking
    this.sessionStartTime = Date.now();
    this.sessionDuration = 90000; // 90 seconds
    this.hitCount = 0;
    
    // Performance metrics for end-of-run
    this.timingAccuracy = [];
    this.flowScore = 0;
    this.tasteScore = 100; // Starts full, decreases with repetition
    this.patternHistory = [];
    
    // Telemetry
    this.telemetryEvents = [];
    
    // Callbacks
    this.onHypeChange = null;
    
    // Setup beat clock callbacks
    this.setupBeatCallbacks();
    
    // Schedule end of run
    this.scheduleEndOfRun();
  }
  
  setupBeatCallbacks() {
    // Update UI on drop window changes
    this.audioEngine.beatClock.onDropWindow = (isOpen) => {
      this.updateDropWindowUI(isOpen);
    };
    
    // Track phrase changes
    this.audioEngine.beatClock.onPhrase = (phraseNum) => {
      console.log(`Phrase ${phraseNum}`);
    };
  }
  
  scheduleEndOfRun() {
    setTimeout(() => {
      this.endRun();
    }, this.sessionDuration);
  }

  handleAction(action) {
    switch (action.type) {
      case 'PAD_PRESS':
        this.handlePadPress(action);
        break;
      case 'ROLL_START':
        this.handleRollStart(action);
        break;
      case 'ROLL_STOP':
        this.handleRollStop(action);
        break;
      case 'PAD_HOLD_RELEASE':
        this.handleHoldRelease(action);
        break;
      case 'DROP_TRIGGER':
        this.handleDrop();
        break;
    }
    
    this.updateUI();
  }

  handlePadPress(action) {
    const { padId, velocity } = action;
    
    // Play the sound
    this.audioEngine.playSlice(padId, velocity);
    
    // Update game state
    this.hitCount++;
    
    // Calculate timing accuracy
    const now = Date.now();
    const timeSinceLastHit = now - this.lastHitTime;
    this.lastHitTime = now;
    
    // Track timing accuracy
    const expectedBeatInterval = 60000 / this.audioEngine.bpm / 4; // 16th note interval
    const timingError = Math.abs(timeSinceLastHit % expectedBeatInterval);
    this.timingAccuracy.push(Math.min(timingError, 100));
    
    // Update combo
    if (timeSinceLastHit < 1000) {
      this.combo++;
      this.flowScore = Math.min(100, this.flowScore + 2);
    } else {
      this.combo = 1;
      this.flowScore = Math.max(0, this.flowScore - 5);
    }
    
    // Track patterns for taste scoring
    this.patternHistory.push(padId);
    if (this.patternHistory.length > 16) {
      this.patternHistory.shift();
      
      // Check for repetition
      const recentPattern = this.patternHistory.slice(-4).join(',');
      const previousPattern = this.patternHistory.slice(-8, -4).join(',');
      if (recentPattern === previousPattern) {
        this.tasteScore = Math.max(0, this.tasteScore - 5);
      }
    }
    
    // Add to score
    const baseScore = 100;
    const comboMultiplier = Math.min(this.combo, 10);
    this.score += baseScore * comboMultiplier;
    
    // Build hype
    const oldHype = this.hype;
    this.hype = Math.min(this.maxHype, this.hype + 5);
    
    // Check if hype is full
    if (this.hype >= this.maxHype && oldHype < this.maxHype) {
      this.visualFX?.hypeFullEffect();
    }
    
    // Notify hype change
    if (this.onHypeChange && this.hype !== oldHype) {
      this.onHypeChange(this.hype);
    }
    
    // Visual effects
    const timingFeedback = timingError < this.perfectWindow ? 'perfect' : 
                           timingError < this.goodWindow ? 'good' : 'ok';
    
    // Add visual feedback for pad hits
    const pad = document.querySelector(`[data-pad="${padId}"]`);
    if (this.visualFX && pad) {
      const intensity = velocity * (timingError < this.perfectWindow ? 1 : 0.7);
      this.visualFX.hitImpact(pad, intensity);
      
      // Perfect hit particles
      if (timingError < this.perfectWindow) {
        const rect = pad.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        this.visualFX.perfectHitParticles(centerX, centerY);
      }
    }
    
    // Combo visual effects
    if (this.combo > 1 && this.visualFX) {
      this.visualFX.comboEffect(this.combo);
    }
    
    this.showHitFeedback(padId, timingFeedback);
  }

  handleRollStart(action) {
    const { padId, rate } = action;
    this.audioEngine.startRoll(padId, rate);
    
    // Rolls build hype faster
    this.hype = Math.min(this.maxHype, this.hype + 15);
  }

  handleRollStop(action) {
    const { padId } = action;
    this.audioEngine.stopRoll(padId);
  }

  handleHoldRelease(action) {
    const { padId, duration } = action;
    console.log(`Hold released on pad ${padId} after ${duration}ms`);
    
    // Check if released on beat 4 (simplified)
    const perfectRelease = duration > 400 && duration < 600;
    if (perfectRelease) {
      this.showHitFeedback(padId, 'Nice release!');
      this.hype = Math.min(this.maxHype, this.hype + 10);
    }
  }

  handleDrop() {
    if (this.hype >= 50) {
      const success = this.audioEngine.triggerDrop(this.hype);
      
      if (success) {
        // Score bonus
        this.score += this.hype * 10;
        
        // Track timing
        const dropTiming = this.audioEngine.beatClock.isDropWindow ? 'on' : 'late';
        
        // Visual drop effect
        const intensity = this.hype / this.maxHype;
        this.visualFX?.dropEffect(intensity);
        
        // Reset hype after spending
        const spentHype = this.hype;
        this.hype = 0;
        
        // Telemetry
        this.emitTelemetry('drop', { 
          window: dropTiming, 
          hype: spentHype 
        });
        
        this.showHitFeedback('drop', 'DROP!');
      } else {
        this.showHitFeedback('drop', 'Missed window!');
      }
    } else {
      this.showHitFeedback('drop', 'Need more hype!');
    }
  }
  
  updateDropWindowUI(isOpen) {
    const hypeContainer = document.querySelector('.hype-container');
    if (hypeContainer) {
      if (isOpen && this.hype >= 50) {
        hypeContainer.classList.add('drop-ready');
      } else {
        hypeContainer.classList.remove('drop-ready');
      }
    }
  }
  
  endRun() {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    // Stop audio
    this.audioEngine.beatClock.stop();
    
    // Calculate final scores
    const timingScore = this.calculateTimingScore();
    const flowScore = this.calculateFlowScore();
    const tasteScore = this.tasteScore;
    
    // Show end-of-run screen
    this.showEndOfRun({
      score: this.score,
      timing: timingScore,
      flow: flowScore,
      taste: tasteScore,
      hitCount: this.hitCount,
      duration: this.sessionDuration / 1000
    });
  }
  
  calculateTimingScore() {
    if (this.timingAccuracy.length === 0) return 50;
    const avg = this.timingAccuracy.reduce((a, b) => a + b, 0) / this.timingAccuracy.length;
    return Math.max(0, Math.min(100, 100 - avg));
  }
  
  calculateFlowScore() {
    // Based on combo maintenance
    return Math.min(100, this.flowScore);
  }
  
  showEndOfRun(stats) {
    // Create end-of-run overlay
    const overlay = document.createElement('div');
    overlay.id = 'end-of-run';
    overlay.innerHTML = `
      <div class="end-content">
        <h2>RUN COMPLETE!</h2>
        
        <div class="final-score">
          <span class="score-label">SCORE</span>
          <span class="score-value">${stats.score.toLocaleString()}</span>
        </div>
        
        <div class="performance-sliders">
          <div class="slider-row">
            <span class="slider-label">TIMING</span>
            <div class="slider-track">
              <div class="slider-fill" style="width: ${stats.timing}%"></div>
            </div>
            <span class="slider-value">${Math.round(stats.timing)}%</span>
          </div>
          
          <div class="slider-row">
            <span class="slider-label">FLOW</span>
            <div class="slider-track">
              <div class="slider-fill" style="width: ${stats.flow}%"></div>
            </div>
            <span class="slider-value">${Math.round(stats.flow)}%</span>
          </div>
          
          <div class="slider-row">
            <span class="slider-label">TASTE</span>
            <div class="slider-track">
              <div class="slider-fill" style="width: ${stats.taste}%"></div>
            </div>
            <span class="slider-value">${Math.round(stats.taste)}%</span>
          </div>
        </div>
        
        <div class="run-stats">
          <span>${stats.hitCount} hits in ${stats.duration}s</span>
        </div>
        
        <div class="clip-section">
          <h3>Your Clip</h3>
          <div class="clip-controls">
            <button id="play-clip">▶ PLAY</button>
            <button id="download-clip">💾 SAVE</button>
            <button id="share-clip">🔗 SHARE</button>
          </div>
        </div>
        
        <div class="end-actions">
          <button onclick="location.reload()">PLAY AGAIN</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Setup clip controls
    this.setupClipControls();
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
  }
  
  setupClipControls() {
    // Get the latest clip from the recorder
    const clipRecorder = window.breakBrawler?.clipRecorder;
    const clip = clipRecorder?.getLatestClip();
    
    if (!clip) {
      // Disable clip controls if no clip available
      const clipSection = document.querySelector('.clip-section');
      if (clipSection) {
        clipSection.style.opacity = '0.5';
        clipSection.innerHTML = '<h3>No Clip Recorded</h3><p>Start playing to auto-record a clip!</p>';
      }
      return;
    }
    
    // Setup play button
    const playBtn = document.getElementById('play-clip');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.playClip(clip);
      });
    }
    
    // Setup download button
    const downloadBtn = document.getElementById('download-clip');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        clipRecorder.downloadClip(clip);
      });
    }
    
    // Setup share button
    const shareBtn = document.getElementById('share-clip');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        clipRecorder.shareClip(clip);
      });
    }
  }
  
  playClip(clip) {
    // Create audio element to play the clip
    const audio = new Audio(clip.url);
    audio.volume = 0.8;
    
    const playBtn = document.getElementById('play-clip');
    if (playBtn) {
      playBtn.textContent = '⏸ STOP';
      playBtn.onclick = () => {
        audio.pause();
        audio.currentTime = 0;
        playBtn.textContent = '▶ PLAY';
        playBtn.onclick = () => this.playClip(clip);
      };
    }
    
    audio.play().catch(console.error);
    
    audio.onended = () => {
      if (playBtn) {
        playBtn.textContent = '▶ PLAY';
        playBtn.onclick = () => this.playClip(clip);
      }
    };
  }

  showHitFeedback(padId, message) {
    // Create floating feedback text
    const feedback = document.createElement('div');
    feedback.className = 'hit-feedback';
    feedback.textContent = message;
    
    if (padId === 'drop') {
      feedback.style.left = '50%';
      feedback.style.top = '50%';
    } else {
      const pad = document.querySelector(`[data-pad="${padId}"]`);
      if (pad) {
        const rect = pad.getBoundingClientRect();
        feedback.style.left = rect.left + rect.width / 2 + 'px';
        feedback.style.top = rect.top + 'px';
      }
    }
    
    document.body.appendChild(feedback);
    
    // Animate and remove
    setTimeout(() => {
      feedback.classList.add('fade-out');
      setTimeout(() => feedback.remove(), 500);
    }, 100);
  }

  updateUI() {
    // Update score display
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
    
    // Update combo display
    const comboEl = document.getElementById('combo');
    if (comboEl) {
      comboEl.textContent = `${this.combo}x`;
      comboEl.style.display = this.combo > 1 ? 'block' : 'none';
    }
    
    // Update hype meter
    const hypeFill = document.getElementById('hype-fill');
    if (hypeFill) {
      const percentage = (this.hype / this.maxHype) * 100;
      hypeFill.style.width = `${percentage}%`;
      
      // Change color based on level
      if (percentage >= 50) {
        hypeFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ffd93d)';
      } else {
        hypeFill.style.background = 'linear-gradient(90deg, #4dabf7, #69db7c)';
      }
    }
  }

  emitTelemetry(event, data) {
    const telemetryEvent = {
      event,
      timestamp: Date.now(),
      sessionTime: Date.now() - this.sessionStartTime,
      ...data
    };
    
    this.telemetryEvents.push(telemetryEvent);
    
    window.dispatchEvent(new CustomEvent('telemetry', {
      detail: telemetryEvent
    }));
  }
}