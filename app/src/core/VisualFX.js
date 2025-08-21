export class VisualFX {
  constructor() {
    this.activeEffects = new Set();
  }
  
  // Screen shake effect
  screenShake(intensity = 1, duration = 500) {
    if (this.activeEffects.has('shake')) return;
    
    this.activeEffects.add('shake');
    
    const body = document.body;
    const originalTransform = body.style.transform || '';
    
    const startTime = Date.now();
    const shake = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        // Reset
        body.style.transform = originalTransform;
        this.activeEffects.delete('shake');
        return;
      }
      
      // Exponential decay
      const currentIntensity = intensity * (1 - progress) * (1 - progress);
      const x = (Math.random() - 0.5) * currentIntensity * 10;
      const y = (Math.random() - 0.5) * currentIntensity * 10;
      
      body.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
      
      requestAnimationFrame(shake);
    };
    
    shake();
  }
  
  // Screen flash effect
  screenFlash(color = 'rgba(255, 255, 255, 0.8)', duration = 200) {
    if (this.activeEffects.has('flash')) return;
    
    this.activeEffects.add('flash');
    
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${color};
      z-index: 9999;
      pointer-events: none;
      opacity: 1;
      transition: opacity ${duration}ms ease-out;
    `;
    
    document.body.appendChild(flash);
    
    // Trigger fade out
    requestAnimationFrame(() => {
      flash.style.opacity = '0';
    });
    
    // Remove element
    setTimeout(() => {
      flash.remove();
      this.activeEffects.delete('flash');
    }, duration);
  }
  
  // Bass drop visual effect
  dropEffect(intensity = 1) {
    // Combine shake and flash
    this.screenShake(intensity * 2, 800);
    this.screenFlash('rgba(255, 217, 61, 0.6)', 300);
    
    // Add pulsing effect to pads
    this.pulsePads(intensity);
  }
  
  // Make all pads pulse
  pulsePads(intensity = 1) {
    const pads = document.querySelectorAll('.pad');
    
    pads.forEach((pad, index) => {
      // Stagger the pulse effect
      setTimeout(() => {
        this.pulseSinglePad(pad, intensity);
      }, index * 50);
    });
  }
  
  pulseSinglePad(pad, intensity = 1) {
    const originalTransform = pad.style.transform;
    const maxScale = 1 + (intensity * 0.3);
    
    pad.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
    pad.style.transform = `scale(${maxScale})`;
    pad.style.boxShadow = `0 0 30px rgba(255, 217, 61, ${intensity * 0.8})`;
    
    setTimeout(() => {
      pad.style.transform = originalTransform;
      pad.style.boxShadow = '';
      
      // Clear transition after animation
      setTimeout(() => {
        pad.style.transition = '';
      }, 300);
    }, 300);
  }
  
  // Hit impact effect
  hitImpact(element, intensity = 1) {
    if (!element) return;
    
    const originalScale = element.style.transform;
    const maxScale = 1 + (intensity * 0.15);
    
    element.style.transition = 'transform 0.1s ease-out';
    element.style.transform = `scale(${maxScale})`;
    
    // Add glow
    const glowColor = this.getHitColor(intensity);
    element.style.boxShadow = `0 0 20px ${glowColor}`;
    
    setTimeout(() => {
      element.style.transform = originalScale;
      element.style.boxShadow = '';
      
      setTimeout(() => {
        element.style.transition = '';
      }, 100);
    }, 100);
  }
  
  getHitColor(intensity) {
    if (intensity > 0.8) return 'rgba(255, 107, 107, 0.8)'; // Red for hard hits
    if (intensity > 0.6) return 'rgba(255, 217, 61, 0.8)';  // Yellow for medium
    return 'rgba(105, 219, 124, 0.8)';                      // Green for light
  }
  
  // Combo multiplier visual
  comboEffect(multiplier) {
    const comboEl = document.getElementById('combo');
    if (!comboEl || multiplier <= 1) return;
    
    // Scale effect based on combo multiplier
    const scale = Math.min(1.5, 1 + (multiplier * 0.05));
    
    comboEl.style.transition = 'transform 0.2s ease-out';
    comboEl.style.transform = `scale(${scale})`;
    
    // Add color intensity based on multiplier
    const intensity = Math.min(1, multiplier / 10);
    comboEl.style.textShadow = `0 0 ${20 * intensity}px rgba(255, 217, 61, ${intensity})`;
    
    setTimeout(() => {
      comboEl.style.transform = 'scale(1)';
      comboEl.style.textShadow = '';
      
      setTimeout(() => {
        comboEl.style.transition = '';
      }, 200);
    }, 200);
  }
  
  // Hype meter pulse when full
  hypeFullEffect() {
    const hypeFill = document.getElementById('hype-fill');
    if (!hypeFill) return;
    
    hypeFill.style.animation = 'hype-full 0.5s ease-in-out';
    
    // Remove animation after it completes
    setTimeout(() => {
      hypeFill.style.animation = '';
    }, 500);
  }
  
  // Particle-like effect for perfect hits
  perfectHitParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      this.createParticle(x, y, i);
    }
  }
  
  createParticle(centerX, centerY, index) {
    const particle = document.createElement('div');
    
    const angle = (Math.PI * 2 * index) / 5;
    const distance = 30 + Math.random() * 20;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    particle.style.cssText = `
      position: fixed;
      left: ${centerX}px;
      top: ${centerY}px;
      width: 4px;
      height: 4px;
      background: #ffd93d;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      transition: all 0.8s ease-out;
    `;
    
    document.body.appendChild(particle);
    
    // Animate particle
    requestAnimationFrame(() => {
      particle.style.transform = `translate(${x - centerX}px, ${y - centerY}px)`;
      particle.style.opacity = '0';
      particle.style.transform += ' scale(0.5)';
    });
    
    // Remove particle
    setTimeout(() => {
      particle.remove();
    }, 800);
  }
}