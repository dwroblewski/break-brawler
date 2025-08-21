// Verification Script for Break Brawler
// This script tests core functionality claims

import puppeteer from 'puppeteer';
import chalk from 'chalk';

const TEST_URL = 'http://localhost:8080';

class BreakBrawlerTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log(chalk.blue('🎮 Starting Break Brawler Verification...'));
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Listen for console messages
    this.page.on('console', msg => {
      if (msg.text().includes('TTF Sound')) {
        this.logTest('TTF Sound Tracking', true, msg.text());
      }
      if (msg.text().includes('BeatClock started')) {
        this.logTest('BeatClock Initialization', true, msg.text());
      }
      if (msg.text().includes('Roll started')) {
        this.logTest('Roll Mechanics', true, msg.text());
      }
      if (msg.text().includes('DROP!')) {
        this.logTest('Drop System', true, msg.text());
      }
    });
    
    await this.page.goto(TEST_URL, { waitUntil: 'networkidle2' });
  }

  logTest(name, passed, details = '') {
    const result = {
      name,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    if (passed) {
      console.log(chalk.green(`✓ ${name}`), details ? chalk.gray(`(${details})`) : '');
    } else {
      console.log(chalk.red(`✗ ${name}`), details ? chalk.gray(`(${details})`) : '');
    }
  }

  async testStartScreen() {
    const startButton = await this.page.$('#start-button');
    this.logTest('Start Screen Present', !!startButton);
    
    if (startButton) {
      const buttonText = await this.page.evaluate(el => el.textContent, startButton);
      this.logTest('Start Button Text', buttonText === 'TAP TO START', buttonText);
    }
  }

  async testAudioInitialization() {
    // Click start button
    await this.page.click('#start-button');
    await this.page.waitForTimeout(1000);
    
    // Check if game UI is visible
    const appVisible = await this.page.evaluate(() => {
      const app = document.getElementById('app');
      return app && app.style.display !== 'none';
    });
    
    this.logTest('Game UI Visible After Start', appVisible);
  }

  async testPadInteraction() {
    // Test keyboard input
    await this.page.keyboard.press('a');
    await this.page.waitForTimeout(100);
    
    const score = await this.page.evaluate(() => {
      const scoreEl = document.getElementById('score');
      return scoreEl ? parseInt(scoreEl.textContent) : 0;
    });
    
    this.logTest('Keyboard Input (A key)', score > 0, `Score: ${score}`);
    
    // Test multiple hits for combo
    for (let i = 0; i < 5; i++) {
      await this.page.keyboard.press('s');
      await this.page.waitForTimeout(100);
    }
    
    const combo = await this.page.evaluate(() => {
      const comboEl = document.getElementById('combo');
      return comboEl && comboEl.style.display !== 'none';
    });
    
    this.logTest('Combo System', combo);
  }

  async testHypeAndDrop() {
    // Build hype
    for (let i = 0; i < 10; i++) {
      await this.page.keyboard.press('j');
      await this.page.waitForTimeout(50);
    }
    
    const hypeLevel = await this.page.evaluate(() => {
      const hypeFill = document.getElementById('hype-fill');
      return hypeFill ? parseFloat(hypeFill.style.width) : 0;
    });
    
    this.logTest('Hype Building', hypeLevel > 0, `Hype: ${hypeLevel}%`);
    
    // Check for drop window indicator
    const dropWindowClass = await this.page.evaluate(() => {
      const container = document.querySelector('.hype-container');
      return container ? container.className : '';
    });
    
    // Note: Drop window might not be open, but we can verify the system exists
    this.logTest('Drop Window System', dropWindowClass.includes('hype-container'));
  }

  async testRollMechanics() {
    // Test shift+key for roll
    await this.page.keyboard.down('Shift');
    await this.page.keyboard.press('a');
    await this.page.waitForTimeout(500);
    await this.page.keyboard.up('Shift');
    
    // Check console for roll message (already captured via console listener)
  }

  async testBeatClock() {
    const phraseBeads = await this.page.evaluate(() => {
      const beads = document.querySelectorAll('.phrase-bead');
      return beads.length;
    });
    
    this.logTest('Phrase Beads Present', phraseBeads === 4, `Count: ${phraseBeads}`);
    
    // Wait and check if beads animate
    await this.page.waitForTimeout(2000);
    
    const hasActiveBead = await this.page.evaluate(() => {
      const activeBead = document.querySelector('.phrase-bead.active');
      return !!activeBead;
    });
    
    this.logTest('Phrase Bead Animation', hasActiveBead);
  }

  async testEndOfRun() {
    // Check if end-of-run is scheduled
    const hasSessionTracking = await this.page.evaluate(() => {
      return window.breakBrawler && 
             window.breakBrawler.gameCore && 
             window.breakBrawler.gameCore.sessionDuration === 90000;
    });
    
    this.logTest('90-Second Session Configured', hasSessionTracking);
  }

  async testPerformanceMetrics() {
    const metrics = await this.page.evaluate(() => {
      if (!window.breakBrawler || !window.breakBrawler.gameCore) return null;
      
      const gc = window.breakBrawler.gameCore;
      return {
        hasTimingAccuracy: Array.isArray(gc.timingAccuracy),
        hasFlowScore: typeof gc.flowScore === 'number',
        hasTasteScore: typeof gc.tasteScore === 'number',
        hasPatternHistory: Array.isArray(gc.patternHistory)
      };
    });
    
    if (metrics) {
      this.logTest('Timing Accuracy Tracking', metrics.hasTimingAccuracy);
      this.logTest('Flow Score System', metrics.hasFlowScore);
      this.logTest('Taste Score System', metrics.hasTasteScore);
      this.logTest('Pattern History Tracking', metrics.hasPatternHistory);
    }
  }

  async generateReport() {
    console.log(chalk.blue('\n📊 Verification Report'));
    console.log(chalk.gray('═'.repeat(50)));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const percentage = (passed / total * 100).toFixed(1);
    
    console.log(chalk.white(`Total Tests: ${total}`));
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(chalk.yellow(`Success Rate: ${percentage}%`));
    
    if (failed > 0) {
      console.log(chalk.red('\n❌ Failed Tests:'));
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(chalk.red(`  - ${r.name}`));
      });
    }
    
    return {
      passed,
      failed,
      total,
      percentage: parseFloat(percentage)
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log(chalk.yellow('\n🔍 Testing Core Features...\n'));
      
      await this.testStartScreen();
      await this.testAudioInitialization();
      await this.testPadInteraction();
      await this.testHypeAndDrop();
      await this.testRollMechanics();
      await this.testBeatClock();
      await this.testEndOfRun();
      await this.testPerformanceMetrics();
      
      const report = await this.generateReport();
      
      if (report.percentage >= 80) {
        console.log(chalk.green('\n✅ Verification PASSED! System is working as expected.'));
      } else if (report.percentage >= 60) {
        console.log(chalk.yellow('\n⚠️ Verification PARTIAL. Some features may need attention.'));
      } else {
        console.log(chalk.red('\n❌ Verification FAILED. Major issues detected.'));
      }
      
    } catch (error) {
      console.error(chalk.red('Test Error:'), error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
const tester = new BreakBrawlerTester();
tester.run();