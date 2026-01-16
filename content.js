/**
 * Speed Reader Extension - Content Script
 * Uses Shadow DOM for complete style isolation
 */

(function() {
  'use strict';

  let overlay = null;
  let shadow = null;
  let reader = null;
  
  // Default settings (will be overridden by saved settings)
  let settings = {
    theme: 'auto',
    defaultWpm: 350,
    trainingStart: 200,
    trainingTarget: 600,
    trainingDefault: false,
    twitterEnabled: true
  };

  // Load settings from storage
  async function loadSettings() {
    try {
      const saved = await chrome.storage.sync.get(settings);
      settings = { ...settings, ...saved };
    } catch (e) {
      // Use defaults if storage fails
    }
  }
  
  // Initialize settings
  loadSettings();

  // Listen for messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ping') {
      sendResponse({ status: 'ok' });
      return true;
    }
    if (message.action === 'openReader' && message.text) {
      openReader(message.text);
      sendResponse({ status: 'opened' });
      return true;
    }
    if (message.action === 'getSelectionAndOpen') {
      const selection = window.getSelection().toString().trim();
      if (selection) {
        openReader(selection);
        sendResponse({ status: 'opened' });
      } else {
        sendResponse({ status: 'no_selection' });
      }
      return true;
    }
  });

  function cleanText(text) {
    return text
      .replace(/\[\d+\]/g, '')
      .replace(/\[[\w\s]+needed\]/gi, '')
      .replace(/\[(edit|show|hide|more|less)\]/gi, '')
      .replace(/\(pp?\.?\s*\d+[-–]?\d*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function openReader(text) {
    const cleanedText = cleanText(text);
    if (!cleanedText) return;

    // Reload settings before opening
    await loadSettings();

    if (overlay) {
      overlay.remove();
    }

    // Create host element
    overlay = document.createElement('div');
    overlay.id = 'speed-reader-ext';
    overlay.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483647;';
    
    // Attach Shadow DOM for style isolation
    shadow = overlay.attachShadow({ mode: 'closed' });
    
    // Determine theme: use saved setting or auto-detect
    let isDark;
    if (settings.theme === 'dark') {
      isDark = true;
    } else if (settings.theme === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Inject everything into shadow root
    shadow.innerHTML = `
      <style>${getStyles(isDark)}</style>
      ${getHTML()}
    `;
    
    document.body.appendChild(overlay);
    reader = new SpeedReaderWidget(cleanedText, shadow, settings);
  }

  function getStyles(isDark) {
    // Theme colors
    const t = isDark ? {
      bg: '#1a1918',
      bgAlt: 'rgba(255,255,255,0.04)',
      bgDark: 'rgba(0,0,0,0.2)',
      border: 'rgba(255,255,255,0.08)',
      text: '#ffffff',
      textMuted: 'rgba(255,255,255,0.5)',
      textFaint: 'rgba(255,255,255,0.3)',
      accent: '#D97757',
      accentHover: '#E8866A',
      success: '#10B981',
      backdrop: 'rgba(0,0,0,0.6)'
    } : {
      bg: '#ffffff',
      bgAlt: 'rgba(0,0,0,0.04)',
      bgDark: 'rgba(0,0,0,0.06)',
      border: 'rgba(0,0,0,0.1)',
      text: '#1a1918',
      textMuted: 'rgba(0,0,0,0.5)',
      textFaint: 'rgba(0,0,0,0.35)',
      accent: '#D97757',
      accentHover: '#C4583A',
      success: '#10B981',
      backdrop: 'rgba(0,0,0,0.4)'
    };

    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      :host {
        all: initial;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-size: 13px;
        line-height: 1.5;
        color: ${t.text};
      }

      .backdrop {
        position: fixed;
        inset: 0;
        background: ${t.backdrop};
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }

      .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 360px;
        max-width: calc(100vw - 32px);
        background: ${t.bg};
        border-radius: 14px;
        box-shadow: 0 0 0 1px ${t.border}, 0 20px 40px -10px rgba(0,0,0,0.4);
        overflow: hidden;
        animation: modalIn 0.2s ease-out;
      }

      @keyframes modalIn {
        from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid ${t.border};
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .brand-icon {
        width: 28px;
        height: 28px;
        background: ${t.accent};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .brand-icon svg {
        width: 16px;
        height: 16px;
        color: white;
      }

      .brand-title {
        font-size: 14px;
        font-weight: 600;
        color: ${t.text};
      }

      .close {
        width: 28px;
        height: 28px;
        border: none;
        background: ${t.bgAlt};
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${t.textMuted};
        transition: all 0.15s;
      }

      .close:hover {
        background: ${t.bgDark};
        color: ${t.text};
      }

      .close svg {
        width: 14px;
        height: 14px;
      }

      .content {
        padding: 18px;
      }

      .view {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .hidden {
        display: none !important;
      }

      .stats {
        display: flex;
        justify-content: center;
        gap: 28px;
        padding: 6px 0;
      }

      .stat {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }

      .stat-val {
        font-size: 22px;
        font-weight: 600;
        color: ${t.text};
        font-variant-numeric: tabular-nums;
      }

      .stat-lbl {
        font-size: 11px;
        color: ${t.textMuted};
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: ${t.bgAlt};
        border-radius: 8px;
      }

      .toggle-label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
      }

      .toggle-input {
        display: none;
      }

      .toggle-switch {
        width: 38px;
        height: 22px;
        background: ${t.textFaint};
        border-radius: 11px;
        position: relative;
        transition: background 0.2s;
        flex-shrink: 0;
      }

      .toggle-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        background: white;
        border-radius: 50%;
        transition: transform 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }

      .toggle-input:checked + .toggle-switch {
        background: ${t.accent};
      }

      .toggle-input:checked + .toggle-switch::after {
        transform: translateX(16px);
      }

      .toggle-text {
        font-size: 13px;
        font-weight: 500;
        color: ${t.text};
      }

      .toggle-hint {
        font-size: 10px;
        color: ${t.textFaint};
        flex-shrink: 0;
      }

      .training-settings {
        background: ${t.bgAlt};
        border-radius: 8px;
        padding: 14px;
        animation: fadeIn 0.15s;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
      }

      .training-row {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .training-field {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .training-label {
        font-size: 10px;
        font-weight: 600;
        color: ${t.textMuted};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        width: 50px;
        flex-shrink: 0;
      }

      .training-slider {
        flex: 1;
        -webkit-appearance: none;
        height: 4px;
        background: ${t.border};
        border-radius: 2px;
        cursor: pointer;
      }

      .training-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: ${t.accent};
        border-radius: 50%;
        cursor: grab;
        box-shadow: 0 2px 5px rgba(217,119,87,0.3);
      }

      .training-val {
        display: flex;
        align-items: baseline;
        gap: 2px;
        font-size: 13px;
        font-weight: 600;
        color: ${t.accent};
        min-width: 60px;
        justify-content: flex-end;
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
      }

      .training-unit {
        font-size: 10px;
        font-weight: 500;
        color: ${t.textMuted};
      }

      .label {
        display: block;
        font-size: 9px;
        font-weight: 600;
        color: ${t.textMuted};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .field-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .slider {
        flex: 1;
        -webkit-appearance: none;
        height: 3px;
        background: ${t.border};
        border-radius: 2px;
        cursor: pointer;
        min-width: 0;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        background: ${t.accent};
        border-radius: 50%;
        cursor: grab;
        box-shadow: 0 2px 5px rgba(217,119,87,0.3);
      }

      .slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
      }

      .slider-sm {
        width: 90px;
      }

      .field-val {
        font-size: 12px;
        font-weight: 600;
        color: ${t.accent};
        min-width: 32px;
        text-align: right;
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
      }

      .speed-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .speed-row {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .speed-display {
        display: flex;
        align-items: baseline;
        gap: 2px;
        min-width: 72px;
      }

      .speed-val {
        font-size: 26px;
        font-weight: 600;
        color: ${t.accent};
        font-variant-numeric: tabular-nums;
      }

      .speed-unit {
        font-size: 11px;
        color: ${t.textMuted};
      }

      .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px 20px;
        background: ${t.accent};
        color: white;
        border: none;
        border-radius: 10px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }

      .btn:hover {
        background: ${t.accentHover};
      }

      .btn:active {
        transform: scale(0.98);
      }

      .btn svg {
        width: 14px;
        height: 14px;
      }

      .btn-sm {
        width: auto;
        padding: 10px 24px;
        font-size: 13px;
      }

      .hint {
        text-align: center;
        font-size: 10px;
        color: ${t.textFaint};
      }

      .hint kbd {
        padding: 1px 4px;
        background: ${t.bgAlt};
        border-radius: 3px;
        font-family: inherit;
        font-size: 9px;
      }

      /* Reading View */
      .metrics {
        display: flex;
        justify-content: center;
        gap: 28px;
      }

      .metric {
        text-align: center;
      }

      .metric-val {
        font-size: 15px;
        font-weight: 600;
        color: ${t.text};
        font-variant-numeric: tabular-nums;
      }

      .metric-lbl {
        font-size: 9px;
        color: ${t.textMuted};
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-top: 1px;
      }

      .progress-bar {
        height: 3px;
        background: ${t.border};
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: ${t.accent};
        transition: width 0.1s linear;
      }

      .reader {
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${t.bgDark};
        border-radius: 8px;
        position: relative;
        overflow: hidden;
      }

      .focus-line {
        position: absolute;
        left: 50%;
        top: 15%;
        bottom: 15%;
        width: 1px;
        background: ${t.accent};
        opacity: 0.25;
      }

      .word {
        font-size: 30px;
        font-weight: 500;
        white-space: nowrap;
        position: absolute;
        letter-spacing: -0.3px;
      }

      .word-before, .word-after {
        color: ${t.text};
      }

      .word-focus {
        color: ${t.accent};
      }

      .live-speed {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .live-wpm {
        font-size: 12px;
        font-weight: 600;
        color: ${t.accent};
        min-width: 55px;
        font-variant-numeric: tabular-nums;
      }

      .badge {
        padding: 3px 7px;
        background: rgba(217,119,87,0.15);
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        color: ${t.accent};
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .controls {
        display: flex;
        justify-content: center;
        gap: 8px;
      }

      .ctrl {
        width: 38px;
        height: 38px;
        border: none;
        background: ${t.bgAlt};
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${t.textMuted};
        transition: all 0.15s;
      }

      .ctrl:hover {
        background: ${t.bgDark};
        color: ${t.text};
      }

      .ctrl svg {
        width: 15px;
        height: 15px;
      }

      .ctrl-primary {
        width: 46px;
        height: 46px;
        background: ${t.accent};
        color: white;
      }

      .ctrl-primary:hover {
        background: ${t.accentHover};
        color: white;
      }

      /* Done View */
      .done-badge {
        width: 52px;
        height: 52px;
        margin: 0 auto 14px;
        background: ${t.success};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @keyframes pop {
        0% { transform: scale(0); }
        70% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      .done-badge svg {
        width: 26px;
        height: 26px;
        color: white;
      }

      .done-title {
        font-size: 17px;
        font-weight: 600;
        color: ${t.text};
        text-align: center;
        margin-bottom: 4px;
      }

      .done-stats {
        font-size: 12px;
        color: ${t.textMuted};
        text-align: center;
        margin-bottom: 16px;
      }

      .done-stats span {
        font-weight: 600;
        color: ${t.accent};
      }

      .done-stats .peak {
        color: ${t.success};
      }

      .done-actions {
        display: flex;
        justify-content: center;
      }

      .footer {
        padding: 10px 16px;
        border-top: 1px solid ${t.border};
        text-align: center;
      }

      .footer-text {
        font-size: 10px;
        color: ${t.textFaint};
      }

      .footer-text a {
        color: ${t.accent};
        text-decoration: none;
      }
    `;
  }

  function getHTML() {
    return `
      <div class="backdrop"></div>
      <div class="modal">
        <div class="header">
          <div class="brand">
            <div class="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span class="brand-title">Speed Reader</span>
          </div>
          <button class="close" id="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="content">
          <!-- Start View -->
          <div class="view" id="start-view">
            <div class="stats">
              <div class="stat">
                <span class="stat-val" id="word-count">0</span>
                <span class="stat-lbl">words</span>
              </div>
              <div class="stat">
                <span class="stat-val" id="est-time">0:00</span>
                <span class="stat-lbl">est.</span>
              </div>
            </div>

            <div class="toggle-row">
              <label class="toggle-label">
                <input type="checkbox" class="toggle-input" id="training-toggle">
                <span class="toggle-switch"></span>
                <span class="toggle-text">Training Mode</span>
              </label>
              <span class="toggle-hint">Auto-accelerate</span>
            </div>

            <div class="speed-section" id="fixed-speed">
              <span class="label">Speed</span>
              <div class="speed-row">
                <input type="range" class="slider" id="speed-slider" min="100" max="1000" value="350" step="10">
                <div class="speed-display">
                  <span class="speed-val" id="speed-val">350</span>
                  <span class="speed-unit">wpm</span>
                </div>
              </div>
            </div>

            <div class="training-settings hidden" id="training-settings">
              <div class="training-row">
                <div class="training-field">
                  <span class="training-label">Start</span>
                  <input type="range" class="training-slider" id="start-wpm" min="100" max="500" value="200" step="10">
                  <span class="training-val"><span id="start-val">200</span> <span class="training-unit">wpm</span></span>
                </div>
                <div class="training-field">
                  <span class="training-label">Target</span>
                  <input type="range" class="training-slider" id="target-wpm" min="300" max="1200" value="600" step="10">
                  <span class="training-val"><span id="target-val">600</span> <span class="training-unit">wpm</span></span>
                </div>
              </div>
            </div>

            <button class="btn" id="start-btn">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start
            </button>

            <p class="hint"><kbd>Space</kbd> start · <kbd>↑↓</kbd> speed</p>
          </div>

          <!-- Reading View -->
          <div class="view hidden" id="read-view">
            <div class="metrics">
              <div class="metric">
                <span class="metric-val" id="progress">0%</span>
                <span class="metric-lbl">Done</span>
              </div>
              <div class="metric">
                <span class="metric-val" id="remaining">~0:00</span>
                <span class="metric-lbl">Left</span>
              </div>
            </div>

            <div class="progress-bar">
              <div class="progress-fill" id="progress-bar"></div>
            </div>

            <div class="reader">
              <div class="focus-line"></div>
              <div class="word" id="word">
                <span class="word-before"></span><span class="word-focus"></span><span class="word-after"></span>
              </div>
            </div>

            <div class="live-speed">
              <span class="badge hidden" id="training-badge">Training</span>
              <input type="range" class="slider slider-sm" id="live-speed" min="100" max="1200" value="350" step="10">
              <span class="live-wpm" id="live-wpm">350 wpm</span>
            </div>

            <div class="controls">
              <button class="ctrl" id="restart-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
              </button>
              <button class="ctrl ctrl-primary" id="pause-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
              <button class="ctrl" id="skip-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 4 15 12 5 20 5 4"/>
                  <rect x="15" y="4" width="4" height="16"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Done View -->
          <div class="view hidden" id="done-view">
            <div class="done-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 class="done-title">Done!</h3>
            <p class="done-stats">
              <span id="final-words">0</span> words · <span id="final-wpm">0</span> wpm
              <span class="hidden" id="peak-stats"> · <span class="peak" id="peak-wpm">0</span> peak</span>
            </p>
            <div class="done-actions">
              <button class="btn btn-sm" id="again-btn">Again</button>
            </div>
          </div>
        </div>

        <div class="footer">
          <span class="footer-text">by <a href="https://speedreader-claude.vercel.app" target="_blank">Claude</a></span>
        </div>
      </div>
    `;
  }

  class SpeedReaderWidget {
    constructor(text, shadowRoot, settings = {}) {
      this.shadow = shadowRoot;
      this.words = text.split(/\s+/).filter(w => w.length > 0);
      this.wordIndex = 0;
      this.wpm = settings.defaultWpm || 350;
      this.running = false;
      this.paused = false;
      this.timeout = null;
      this.startTime = null;
      this.pausedTime = 0;
      this.pauseStart = null;
      this.trainingMode = settings.trainingDefault || false;
      this.startWPM = settings.trainingStart || 200;
      this.targetWPM = settings.trainingTarget || 600;
      this.peakWPM = 0;

      this.bindElements();
      this.applySettings(settings);
      this.bindEvents();
      this.updateInfo();
    }

    applySettings(settings) {
      // Apply saved default values to inputs
      if (this.speedSlider) {
        this.speedSlider.value = this.wpm;
        this.speedVal.textContent = this.wpm;
      }
      if (this.startWpmSlider) {
        this.startWpmSlider.value = this.startWPM;
        this.startVal.textContent = this.startWPM;
      }
      if (this.targetWpmSlider) {
        this.targetWpmSlider.value = this.targetWPM;
        this.targetVal.textContent = this.targetWPM;
      }
      if (this.trainingMode && this.trainingToggle) {
        this.trainingToggle.checked = true;
        this.fixedSpeed.classList.add('hidden');
        this.trainingSettings.classList.remove('hidden');
      }
    }

    $(id) {
      return this.shadow.getElementById(id);
    }

    bindElements() {
      this.startView = this.$('start-view');
      this.readView = this.$('read-view');
      this.doneView = this.$('done-view');
      
      this.wordCountEl = this.$('word-count');
      this.estTimeEl = this.$('est-time');
      this.trainingToggle = this.$('training-toggle');
      this.trainingSettings = this.$('training-settings');
      this.fixedSpeed = this.$('fixed-speed');
      this.startWpmSlider = this.$('start-wpm');
      this.startVal = this.$('start-val');
      this.targetWpmSlider = this.$('target-wpm');
      this.targetVal = this.$('target-val');
      this.speedSlider = this.$('speed-slider');
      this.speedVal = this.$('speed-val');
      this.startBtn = this.$('start-btn');
      
      this.wordEl = this.$('word');
      this.progressEl = this.$('progress');
      this.remainingEl = this.$('remaining');
      this.progressBar = this.$('progress-bar');
      this.trainingBadge = this.$('training-badge');
      this.liveSpeed = this.$('live-speed');
      this.liveWpm = this.$('live-wpm');
      this.pauseBtn = this.$('pause-btn');
      this.restartBtn = this.$('restart-btn');
      this.skipBtn = this.$('skip-btn');
      
      this.finalWords = this.$('final-words');
      this.finalWpm = this.$('final-wpm');
      this.peakStats = this.$('peak-stats');
      this.peakWpmEl = this.$('peak-wpm');
      this.againBtn = this.$('again-btn');
      
      this.closeBtn = this.$('close');
      this.backdrop = this.shadow.querySelector('.backdrop');
    }

    bindEvents() {
      this.trainingToggle.onchange = () => this.toggleTrainingMode();
      this.startWpmSlider.oninput = () => {
        this.startWPM = +this.startWpmSlider.value;
        this.startVal.textContent = this.startWPM;
        this.updateInfo();
      };
      this.targetWpmSlider.oninput = () => {
        this.targetWPM = +this.targetWpmSlider.value;
        this.targetVal.textContent = this.targetWPM;
        this.updateInfo();
      };
      this.speedSlider.oninput = () => {
        this.wpm = +this.speedSlider.value;
        this.speedVal.textContent = this.wpm;
        this.updateInfo();
      };
      this.liveSpeed.oninput = () => {
        this.wpm = +this.liveSpeed.value;
        this.liveWpm.textContent = this.wpm + ' wpm';
        if (this.wpm > this.peakWPM) this.peakWPM = this.wpm;
      };

      this.startBtn.onclick = () => this.start();
      this.pauseBtn.onclick = () => this.togglePause();
      this.restartBtn.onclick = () => this.restart();
      this.skipBtn.onclick = () => this.skip();
      this.againBtn.onclick = () => this.restart();
      this.closeBtn.onclick = () => this.close();
      this.backdrop.onclick = () => this.close();

      this.keyHandler = this.handleKey.bind(this);
      document.addEventListener('keydown', this.keyHandler);
    }

    toggleTrainingMode() {
      this.trainingMode = this.trainingToggle.checked;
      this.trainingSettings.classList.toggle('hidden', !this.trainingMode);
      this.fixedSpeed.classList.toggle('hidden', this.trainingMode);
      this.updateInfo();
    }

    updateInfo() {
      this.wordCountEl.textContent = this.words.length;
      const avgWpm = this.trainingMode ? (this.startWPM + this.targetWPM) / 2 : this.wpm;
      const mins = this.words.length / avgWpm;
      const m = Math.floor(mins);
      const s = Math.round((mins - m) * 60);
      this.estTimeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }

    showView(name) {
      this.startView.classList.toggle('hidden', name !== 'start');
      this.readView.classList.toggle('hidden', name !== 'read');
      this.doneView.classList.toggle('hidden', name !== 'done');
    }

    start() {
      this.wordIndex = 0;
      this.running = true;
      this.paused = false;
      this.startTime = Date.now();
      this.pausedTime = 0;
      this.peakWPM = 0;

      if (this.trainingMode) {
        this.wpm = this.startWPM;
        this.trainingBadge.classList.remove('hidden');
      } else {
        this.trainingBadge.classList.add('hidden');
      }

      this.liveSpeed.value = this.wpm;
      this.liveWpm.textContent = this.wpm + ' wpm';
      this.peakWPM = this.wpm;

      this.showView('read');
      this.displayWord();
      this.scheduleNext();
      this.updateUI();
    }

    getDelay() {
      let delay = 60000 / this.wpm;
      const word = this.words[this.wordIndex] || '';
      if (/[.!?]$/.test(word)) delay *= 2.5;
      else if (/[,;:]$/.test(word)) delay *= 1.5;
      return delay;
    }

    scheduleNext() {
      if (!this.running || this.paused) return;
      this.timeout = setTimeout(() => this.advance(), this.getDelay());
    }

    advance() {
      if (!this.running || this.paused) return;
      this.wordIndex++;

      if (this.wordIndex >= this.words.length) {
        this.complete();
        return;
      }

      if (this.trainingMode) this.updateTrainingSpeed();
      this.displayWord();
      this.updateUI();
      this.scheduleNext();
    }

    updateTrainingSpeed() {
      const progress = this.wordIndex / this.words.length;
      const range = this.targetWPM - this.startWPM;
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const newWpm = Math.round(this.startWPM + range * eased);

      if (newWpm !== this.wpm) {
        this.wpm = newWpm;
        this.liveSpeed.value = this.wpm;
        this.liveWpm.textContent = this.wpm + ' wpm';
        if (this.wpm > this.peakWPM) this.peakWPM = this.wpm;
      }
    }

    displayWord() {
      const word = this.words[this.wordIndex];
      if (!word) return;

      const { before, focus, after } = this.splitWord(word);
      const beforeEl = this.wordEl.querySelector('.word-before');
      const focusEl = this.wordEl.querySelector('.word-focus');
      const afterEl = this.wordEl.querySelector('.word-after');

      beforeEl.textContent = before;
      focusEl.textContent = focus;
      afterEl.textContent = after;

      requestAnimationFrame(() => {
        const beforeW = beforeEl.getBoundingClientRect().width;
        const focusW = focusEl.getBoundingClientRect().width;
        const offset = beforeW + focusW / 2;
        this.wordEl.style.left = '50%';
        this.wordEl.style.transform = `translateX(-${offset}px)`;
      });
    }

    splitWord(word) {
      const len = word.length;
      let idx = len <= 1 ? 0 : len <= 3 ? 0 : len <= 5 ? 1 : len <= 9 ? 2 : len <= 13 ? 3 : 4;
      return { before: word.slice(0, idx), focus: word[idx] || '', after: word.slice(idx + 1) };
    }

    updateUI() {
      const pct = Math.round(((this.wordIndex + 1) / this.words.length) * 100);
      this.progressEl.textContent = pct + '%';
      this.progressBar.style.width = pct + '%';

      const remaining = this.words.length - this.wordIndex - 1;
      const remSecs = Math.ceil((remaining / this.wpm) * 60);
      const m = Math.floor(remSecs / 60);
      const s = remSecs % 60;
      this.remainingEl.textContent = `~${m}:${s.toString().padStart(2, '0')}`;
    }

    togglePause() {
      if (!this.running) return;
      this.paused = !this.paused;

      if (this.paused) {
        this.pauseStart = Date.now();
        clearTimeout(this.timeout);
      } else {
        if (this.pauseStart) {
          this.pausedTime += Date.now() - this.pauseStart;
          this.pauseStart = null;
        }
        this.scheduleNext();
      }

      this.pauseBtn.innerHTML = this.paused
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    }

    skip() {
      if (!this.running) return;
      clearTimeout(this.timeout);
      this.wordIndex = Math.min(this.wordIndex + 10, this.words.length - 1);
      if (this.trainingMode) this.updateTrainingSpeed();
      this.displayWord();
      this.updateUI();
      this.scheduleNext();
    }

    restart() {
      this.running = false;
      clearTimeout(this.timeout);
      this.showView('start');
    }

    complete() {
      this.running = false;
      clearTimeout(this.timeout);

      const elapsed = Date.now() - this.startTime - this.pausedTime;
      const avgWpm = Math.round(this.words.length / (elapsed / 60000));

      this.finalWords.textContent = this.words.length;
      this.finalWpm.textContent = avgWpm;

      if (this.trainingMode) {
        this.peakStats.classList.remove('hidden');
        this.peakWpmEl.textContent = this.peakWPM;
      } else {
        this.peakStats.classList.add('hidden');
      }

      this.showView('done');
    }

    close() {
      this.running = false;
      clearTimeout(this.timeout);
      document.removeEventListener('keydown', this.keyHandler);
      overlay.remove();
      overlay = null;
      shadow = null;
      reader = null;
    }

    handleKey(e) {
      if (e.code === 'Escape') {
        e.preventDefault();
        this.close();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!this.running) this.start();
        else this.togglePause();
      } else if (e.code === 'ArrowRight' && this.running) {
        this.skip();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        this.adjustSpeed(50);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        this.adjustSpeed(-50);
      }
    }

    adjustSpeed(delta) {
      this.wpm = Math.max(100, Math.min(1200, this.wpm + delta));
      this.speedSlider.value = this.wpm;
      this.speedVal.textContent = this.wpm;
      this.liveSpeed.value = this.wpm;
      this.liveWpm.textContent = this.wpm + ' wpm';
      if (this.wpm > this.peakWPM) this.peakWPM = this.wpm;
      this.updateInfo();
    }
  }

  // ===== TWITTER/X INTEGRATION =====
  
  function isTwitter() {
    return window.location.hostname === 'twitter.com' || 
           window.location.hostname === 'x.com' ||
           window.location.hostname === 'mobile.twitter.com';
  }

  async function initTwitterIntegration() {
    if (!isTwitter()) return;
    
    // Load settings and check if Twitter integration is enabled
    await loadSettings();
    if (!settings.twitterEnabled) {
      console.log('[Speed Reader] Twitter integration disabled');
      return;
    }

    // CSS for the speed reader button
    const style = document.createElement('style');
    style.textContent = `
      .sr-tweet-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34.75px;
        height: 34.75px;
        border-radius: 50%;
        cursor: pointer;
        transition: background-color 0.2s;
        background: transparent;
        border: none;
        padding: 0;
      }
      .sr-tweet-btn:hover {
        background-color: rgba(217, 119, 87, 0.1);
      }
      .sr-tweet-btn:hover svg {
        color: #D97757 !important;
      }
      .sr-tweet-btn svg {
        width: 18px;
        height: 18px;
        color: rgb(83, 100, 113);
        transition: color 0.2s;
      }
      [data-theme="dark"] .sr-tweet-btn svg,
      .dark .sr-tweet-btn svg {
        color: rgb(113, 118, 123);
      }
    `;
    document.head.appendChild(style);

    // Process tweets
    function processTweets() {
      const tweets = document.querySelectorAll('article[data-testid="tweet"]');
      
      tweets.forEach(tweet => {
        // Skip if already processed
        if (tweet.dataset.srProcessed) return;
        tweet.dataset.srProcessed = 'true';

        // Find the action bar (contains reply, repost, like buttons)
        const actionBar = tweet.querySelector('[role="group"]');
        if (!actionBar) return;

        // Get tweet text
        const tweetTextEl = tweet.querySelector('[data-testid="tweetText"]');
        if (!tweetTextEl) return;

        // Create speed reader button container
        const btnContainer = document.createElement('div');
        btnContainer.className = 'css-175oi2r r-18u37iz r-1h0z5md r-13awgt0';
        btnContainer.innerHTML = `
          <button class="sr-tweet-btn" aria-label="Speed Read" title="Speed Read this tweet">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </button>
        `;

        // Add click handler
        const btn = btnContainer.querySelector('.sr-tweet-btn');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Extract tweet text
          let text = tweetTextEl.innerText || tweetTextEl.textContent;
          text = cleanText(text);
          
          if (text) {
            openReader(text);
          }
        });

        // Insert before the last child (views/analytics)
        const children = actionBar.children;
        if (children.length > 0) {
          // Insert as second to last item (before views)
          actionBar.insertBefore(btnContainer, children[children.length - 1]);
        } else {
          actionBar.appendChild(btnContainer);
        }
      });
    }

    // Initial process
    processTweets();

    // Watch for new tweets (infinite scroll, navigation)
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }
      if (shouldProcess) {
        // Debounce processing
        clearTimeout(observer.timeout);
        observer.timeout = setTimeout(processTweets, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[Speed Reader] Twitter integration loaded');
  }

  // Initialize Twitter integration when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTwitterIntegration);
  } else {
    initTwitterIntegration();
  }

  // Listen for settings changes to enable/disable Twitter buttons
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.twitterEnabled) {
      if (changes.twitterEnabled.newValue) {
        initTwitterIntegration();
      } else {
        // Remove all injected buttons
        document.querySelectorAll('.sr-tweet-btn').forEach(btn => {
          btn.closest('.css-175oi2r')?.remove();
        });
        document.querySelectorAll('[data-sr-processed]').forEach(el => {
          el.removeAttribute('data-sr-processed');
        });
      }
    }
  });

  // ===== FLOATING SELECTION BUTTON (Bottom-Left Fixed) =====
  
  let selectionButton = null;
  let selectedText = '';
  
  function createSelectionButton() {
    if (selectionButton) return;
    
    selectionButton = document.createElement('div');
    selectionButton.id = 'sr-selection-btn';
    
    // Inject styles directly to avoid CSP issues
    const style = document.createElement('style');
    style.textContent = `
      #sr-selection-btn {
        position: fixed !important;
        bottom: 24px !important;
        left: 24px !important;
        z-index: 2147483646 !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 14px 20px !important;
        background: linear-gradient(135deg, #D97757 0%, #C4583A 100%) !important;
        color: white !important;
        border-radius: 14px !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        box-shadow: 0 8px 24px rgba(217, 119, 87, 0.4), 0 2px 8px rgba(0,0,0,0.15) !important;
        transform: translateY(100px) !important;
        opacity: 0 !important;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s, box-shadow 0.2s !important;
        user-select: none !important;
        -webkit-font-smoothing: antialiased !important;
        border: none !important;
        outline: none !important;
      }
      #sr-selection-btn.visible {
        transform: translateY(0) !important;
        opacity: 1 !important;
      }
      #sr-selection-btn:hover {
        box-shadow: 0 12px 32px rgba(217, 119, 87, 0.5), 0 4px 12px rgba(0,0,0,0.2) !important;
        transform: translateY(-2px) !important;
      }
      #sr-selection-btn:active {
        transform: translateY(0) scale(0.98) !important;
      }
      #sr-selection-btn svg {
        width: 18px !important;
        height: 18px !important;
        flex-shrink: 0 !important;
      }
      #sr-selection-btn .sr-btn-text {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 2px !important;
      }
      #sr-selection-btn .sr-btn-title {
        font-size: 14px !important;
        font-weight: 600 !important;
        line-height: 1.2 !important;
      }
      #sr-selection-btn .sr-btn-hint {
        font-size: 11px !important;
        font-weight: 500 !important;
        opacity: 0.85 !important;
        line-height: 1 !important;
      }
      #sr-selection-btn .sr-btn-kbd {
        display: inline-flex !important;
        padding: 2px 5px !important;
        background: rgba(255,255,255,0.2) !important;
        border-radius: 4px !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        margin-left: 4px !important;
      }
    `;
    document.head.appendChild(style);
    
    selectionButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <div class="sr-btn-text">
        <span class="sr-btn-title">Speed Read</span>
        <span class="sr-btn-hint"><span class="sr-btn-kbd">Alt+S</span> or click</span>
      </div>
    `;
    
    selectionButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (selectedText) {
        hideSelectionButton();
        openReader(selectedText);
      }
    });
    
    document.body.appendChild(selectionButton);
  }
  
  function showSelectionButton(text) {
    if (!selectionButton) createSelectionButton();
    selectedText = text;
    
    // Small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      selectionButton.classList.add('visible');
    });
  }
  
  function hideSelectionButton() {
    if (selectionButton) {
      selectionButton.classList.remove('visible');
    }
    selectedText = '';
  }
  
  // Listen for text selection
  document.addEventListener('mouseup', (e) => {
    // Don't trigger if clicking our button or if reader is open
    if (e.target.closest('#sr-selection-btn') || overlay) return;
    
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      // Show button if 3+ words selected
      if (text && text.split(/\s+/).length >= 3) {
        showSelectionButton(text);
      } else {
        hideSelectionButton();
      }
    }, 10);
  });
  
  // Hide button when clicking elsewhere (but not on the button itself)
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#sr-selection-btn')) {
      // Small delay to allow selection to complete first
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (!text || text.split(/\s+/).length < 3) {
          hideSelectionButton();
        }
      }, 10);
    }
  });
  
  // Hide when pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selectionButton?.classList.contains('visible')) {
      hideSelectionButton();
      window.getSelection().removeAllRanges();
    }
  });
})();
