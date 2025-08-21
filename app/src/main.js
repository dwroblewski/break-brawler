// Break Brawler - Main Entry Point
// See specs/product/ExperienceSpec.md for feature requirements
// See tests/acceptance/FTUE.feature for acceptance criteria

class InputController {
  constructor() {
    this.keyMap = {
      'a': 1, 's': 2, 'd': 3,
      'j': 4, 'k': 5, 'l': 6,
      ' ': 'drop', 'Enter': 'drop'
    };
    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener('keydown', (e) => {
      const action = this.keyMap[e.key.toLowerCase()];
      if (action) {
        this.handleAction(action);
      }
    });

    document.querySelectorAll('.pad').forEach(pad => {
      pad.addEventListener('click', () => {
        this.handleAction(pad.dataset.pad);
      });
    });
  }

  handleAction(action) {
    console.log('Action:', action);
    // TODO: Connect to AudioEngine per specs/tech/Architecture.md
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  console.log('Break Brawler v0.1 - Spec-first implementation');
  console.log('TTF Sound target: <3s');
  new InputController();
});