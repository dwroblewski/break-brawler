export class GameCore {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    
    // Game state
    this.score = 0;
    this.combo = 0;
    this.hype = 0;
    this.maxHype = 100;
    
    // Timing state
    this.lastHitTime = 0;
    this.perfectWindow = 35; // ms (Expert)
    this.goodWindow = 60; // ms (Normal)
    this.okWindow = 90; // ms (Easy)
    
    // Assist mode
    this.assistLevel = 'Easy';
    
    // Session tracking
    this.sessionStartTime = Date.now();
    this.hitCount = 0;
    
    // Telemetry
    this.telemetryEvents = [];
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
    
    // Calculate timing accuracy (simplified for now)
    const now = Date.now();
    const timeSinceLastHit = now - this.lastHitTime;
    this.lastHitTime = now;
    
    // Update combo
    if (timeSinceLastHit < 1000) {
      this.combo++;
    } else {
      this.combo = 1;
    }
    
    // Add to score
    const baseScore = 100;
    const comboMultiplier = Math.min(this.combo, 10);
    this.score += baseScore * comboMultiplier;
    
    // Build hype
    this.hype = Math.min(this.maxHype, this.hype + 5);
    
    // Visual feedback
    this.showHitFeedback(padId, 'perfect');
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
      this.audioEngine.triggerDrop(this.hype);
      
      // Score bonus
      this.score += this.hype * 10;
      
      // Reset hype after spending
      this.hype = 0;
      
      // Telemetry
      this.emitTelemetry('drop', { 
        window: 'on', 
        hype: this.hype 
      });
      
      this.showHitFeedback('drop', 'DROP!');
    } else {
      this.showHitFeedback('drop', 'Need more hype!');
    }
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