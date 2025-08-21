export class InputController {
  constructor(onAction) {
    this.onAction = onAction;
    
    // Keyboard mapping
    this.keyMap = {
      'a': 1, 's': 2, 'd': 3,
      'j': 4, 'k': 5, 'l': 6,
      'q': 1, 'w': 2, 'e': 3,  // One-hand mode
      ' ': 'drop', 
      'Enter': 'drop'
    };
    
    // Touch tracking
    this.touches = new Map();
    this.velocities = new Map();
    
    // Gesture thresholds
    this.HOLD_THRESHOLD = 100; // ms
    this.SWIPE_THRESHOLD = 50; // pixels
    this.SWIPE_VELOCITY_THRESHOLD = 0.5; // pixels/ms
    
    // Roll state
    this.rollState = new Map();
    this.rollRates = [16, 32, 64];
    this.currentRollRate = 0;
    
    this.setupListeners();
  }

  setupListeners() {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Touch events
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Mouse events (for desktop testing)
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    
    // Check for shift modifier for roll
    if (e.shiftKey && this.keyMap[key] && typeof this.keyMap[key] === 'number') {
      const padId = this.keyMap[key];
      this.startRoll(padId);
      return;
    }
    
    const action = this.keyMap[key];
    if (action) {
      e.preventDefault();
      if (action === 'drop') {
        this.onAction({ type: 'DROP_TRIGGER' });
      } else {
        this.onAction({ type: 'PAD_PRESS', padId: action, velocity: 1.0 });
      }
    }
  }

  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    
    if (e.shiftKey && this.keyMap[key] && typeof this.keyMap[key] === 'number') {
      const padId = this.keyMap[key];
      this.stopRoll(padId);
    }
  }

  handleTouchStart(e) {
    e.preventDefault();
    
    for (const touch of e.changedTouches) {
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const padId = element?.dataset?.pad;
      
      if (padId) {
        this.touches.set(touch.identifier, {
          padId,
          startTime: Date.now(),
          startX: touch.clientX,
          startY: touch.clientY,
          lastX: touch.clientX,
          lastY: touch.clientY,
          lastTime: Date.now()
        });
        
        // Immediate feedback
        element.classList.add('active');
      }
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    
    for (const touch of e.changedTouches) {
      const touchData = this.touches.get(touch.identifier);
      if (touchData) {
        const now = Date.now();
        const dx = touch.clientX - touchData.lastX;
        const dy = touch.clientY - touchData.lastY;
        const dt = now - touchData.lastTime;
        
        // Calculate velocity
        const velocity = Math.sqrt(dx * dx + dy * dy) / Math.max(1, dt);
        this.velocities.set(touch.identifier, velocity);
        
        // Update position
        touchData.lastX = touch.clientX;
        touchData.lastY = touch.clientY;
        touchData.lastTime = now;
        
        // Check for swipe gesture
        const totalDx = touch.clientX - touchData.startX;
        const totalDy = touch.clientY - touchData.startY;
        const totalDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
        
        if (totalDistance > this.SWIPE_THRESHOLD && velocity > this.SWIPE_VELOCITY_THRESHOLD) {
          // Swipe detected - start roll
          if (!touchData.isRolling) {
            touchData.isRolling = true;
            this.startRoll(touchData.padId);
          }
        }
      }
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    
    for (const touch of e.changedTouches) {
      const touchData = this.touches.get(touch.identifier);
      if (touchData) {
        const duration = Date.now() - touchData.startTime;
        const element = document.querySelector(`[data-pad="${touchData.padId}"]`);
        
        if (element) {
          element.classList.remove('active');
        }
        
        if (touchData.isRolling) {
          // End roll
          this.stopRoll(touchData.padId);
        } else if (duration >= this.HOLD_THRESHOLD) {
          // Hold gesture
          this.onAction({ 
            type: 'PAD_HOLD_RELEASE', 
            padId: touchData.padId,
            duration 
          });
        } else {
          // Tap
          this.onAction({ 
            type: 'PAD_PRESS', 
            padId: touchData.padId,
            velocity: 1.0 
          });
        }
        
        this.touches.delete(touch.identifier);
        this.velocities.delete(touch.identifier);
      }
    }
  }

  // Mouse handlers for desktop testing
  handleMouseDown(e) {
    const element = e.target.closest('.pad');
    if (element) {
      const padId = element.dataset.pad;
      const fakeTouch = {
        identifier: 'mouse',
        clientX: e.clientX,
        clientY: e.clientY
      };
      this.handleTouchStart({ 
        preventDefault: () => {}, 
        changedTouches: [fakeTouch] 
      });
    }
  }

  handleMouseMove(e) {
    if (this.touches.has('mouse')) {
      const fakeTouch = {
        identifier: 'mouse',
        clientX: e.clientX,
        clientY: e.clientY
      };
      this.handleTouchMove({ 
        preventDefault: () => {}, 
        changedTouches: [fakeTouch] 
      });
    }
  }

  handleMouseUp(e) {
    if (this.touches.has('mouse')) {
      const fakeTouch = {
        identifier: 'mouse',
        clientX: e.clientX,
        clientY: e.clientY
      };
      this.handleTouchEnd({ 
        preventDefault: () => {}, 
        changedTouches: [fakeTouch] 
      });
    }
  }

  startRoll(padId) {
    const rate = this.rollRates[this.currentRollRate];
    this.onAction({ type: 'ROLL_START', padId, rate });
    this.rollState.set(padId, true);
    
    // Cycle through roll rates
    this.currentRollRate = (this.currentRollRate + 1) % this.rollRates.length;
  }

  stopRoll(padId) {
    if (this.rollState.get(padId)) {
      this.onAction({ type: 'ROLL_STOP', padId });
      this.rollState.delete(padId);
    }
  }
}