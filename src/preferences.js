let currentSettings = {};

// Performance logging
function perfLog(message, startTime) {
  if (startTime) {
    console.log(`⏱️  [AI-PERF] ${message} took: ${Date.now() - startTime}ms`);
  } else {
    console.log(`⏱️  [AI-PERF] ${message}`);
  }
}

// Initialize preferences
async function init() {
  const startTime = Date.now();
  perfLog('Initializing preferences window');
  
  // Load current settings
  currentSettings = await window.api.getSettings();
  perfLog('Settings loaded', startTime);
  
  // Set refresh interval
  const refreshSlider = document.getElementById('refreshInterval');
  const refreshValue = document.getElementById('refreshValue');
  refreshSlider.value = currentSettings.refreshInterval || 5;
  refreshValue.textContent = `${refreshSlider.value}s`;
  
  refreshSlider.addEventListener('input', (e) => {
    refreshValue.textContent = `${e.target.value}s`;
  });
  
  refreshSlider.addEventListener('change', async (e) => {
    const startTime = Date.now();
    await saveSettings({ refreshInterval: parseInt(e.target.value) });
    perfLog(`Refresh interval updated to ${e.target.value}s`, startTime);
  });
  
  // Set checkboxes
  document.getElementById('launchAtLogin').checked = currentSettings.launchAtLogin || false;
  document.getElementById('showDockerPorts').checked = currentSettings.showDockerPorts !== false;
  document.getElementById('showSystemPorts').checked = currentSettings.showSystemPorts !== false;
  document.getElementById('showServiceIcons').checked = currentSettings.showServiceIcons || false;
  
  // Add checkbox listeners
  document.getElementById('launchAtLogin').addEventListener('change', async (e) => {
    const startTime = Date.now();
    await saveSettings({ launchAtLogin: e.target.checked });
    perfLog(`Launch at login set to ${e.target.checked}`, startTime);
  });
  
  document.getElementById('showDockerPorts').addEventListener('change', async (e) => {
    const startTime = Date.now();
    await saveSettings({ showDockerPorts: e.target.checked });
    perfLog(`Show Docker ports set to ${e.target.checked}`, startTime);
  });
  
  document.getElementById('showSystemPorts').addEventListener('change', async (e) => {
    const startTime = Date.now();
    await saveSettings({ showSystemPorts: e.target.checked });
    perfLog(`Show system ports set to ${e.target.checked}`, startTime);
  });
  
  document.getElementById('showServiceIcons').addEventListener('change', async (e) => {
    const startTime = Date.now();
    await saveSettings({ showServiceIcons: e.target.checked });
    perfLog(`Show service icons set to ${e.target.checked}`, startTime);
  });
  
  // Set ignore rules
  const ignoreRules = document.getElementById('ignoreRules');
  ignoreRules.value = (currentSettings.ignoreRules || []).join('\n');
  
  // Debounced save for ignore rules
  let ignoreRulesTimeout;
  ignoreRules.addEventListener('input', () => {
    clearTimeout(ignoreRulesTimeout);
    ignoreRulesTimeout = setTimeout(async () => {
      const startTime = Date.now();
      const rules = ignoreRules.value
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);
      await saveSettings({ ignoreRules: rules });
      perfLog(`Ignore rules updated (${rules.length} rules)`, startTime);
    }, 500);
  });
  
  perfLog('Preferences window initialized', startTime);
}


// Save settings
async function saveSettings(updates) {
  currentSettings = { ...currentSettings, ...updates };
  await window.api.setSettings(updates);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}