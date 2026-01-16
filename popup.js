// Speed Reader Extension - Popup Settings

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const themeToggle = document.getElementById('theme-toggle');
  const defaultWpm = document.getElementById('default-wpm');
  const trainingStart = document.getElementById('training-start');
  const trainingTarget = document.getElementById('training-target');
  const trainingDefault = document.getElementById('training-default');
  const twitterEnabled = document.getElementById('twitter-enabled');
  const saveIndicator = document.getElementById('save-indicator');

  // Detect system theme preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Load saved settings (use system preference as default for theme)
  const settings = await chrome.storage.sync.get({
    theme: prefersDark ? 'dark' : 'light',
    defaultWpm: 350,
    trainingStart: 200,
    trainingTarget: 600,
    trainingDefault: false,
    twitterEnabled: true
  });

  // Apply theme
  if (settings.theme === 'dark') {
    document.body.classList.add('dark');
  }

  // Populate values
  defaultWpm.value = settings.defaultWpm;
  trainingStart.value = settings.trainingStart;
  trainingTarget.value = settings.trainingTarget;
  if (settings.trainingDefault) trainingDefault.classList.add('active');
  if (settings.twitterEnabled) twitterEnabled.classList.add('active');
  else twitterEnabled.classList.remove('active');

  // Save function with indicator
  async function save(key, value) {
    await chrome.storage.sync.set({ [key]: value });
    
    // Show save indicator
    saveIndicator.classList.add('show');
    setTimeout(() => saveIndicator.classList.remove('show'), 1500);
  }

  // Theme toggle
  themeToggle.addEventListener('click', async () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    await save('theme', isDark ? 'dark' : 'light');
  });

  // Number inputs with debounce
  let debounceTimer;
  function handleNumberInput(input, key) {
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const value = parseInt(input.value) || parseInt(input.min);
        const min = parseInt(input.min);
        const max = parseInt(input.max);
        const clamped = Math.max(min, Math.min(max, value));
        input.value = clamped;
        save(key, clamped);
      }, 500);
    });
  }

  handleNumberInput(defaultWpm, 'defaultWpm');
  handleNumberInput(trainingStart, 'trainingStart');
  handleNumberInput(trainingTarget, 'trainingTarget');

  // Toggle handlers
  trainingDefault.addEventListener('click', async () => {
    trainingDefault.classList.toggle('active');
    await save('trainingDefault', trainingDefault.classList.contains('active'));
  });

  twitterEnabled.addEventListener('click', async () => {
    twitterEnabled.classList.toggle('active');
    await save('twitterEnabled', twitterEnabled.classList.contains('active'));
  });
});
