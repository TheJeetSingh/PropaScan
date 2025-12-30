// Settings page logic for PropaScan Extension

const MODES = {
  SENTINEL: 'sentinel',
  PATROL: 'patrol',
  TARGETSCAN: 'targetscan'
};

// Default mode
const DEFAULT_MODE = MODES.PATROL;

// Load current mode from storage
async function loadCurrentMode() {
  try {
    const result = await chrome.storage.sync.get(['detectionMode']);
    const mode = result.detectionMode || DEFAULT_MODE;
    
    // Set the radio button
    const radio = document.getElementById(`mode-${mode}`);
    if (radio) {
      radio.checked = true;
      updateModeSelection(mode);
    }
  } catch (error) {
    console.error('Error loading mode:', error);
    // Set default
    const radio = document.getElementById(`mode-${DEFAULT_MODE}`);
    if (radio) {
      radio.checked = true;
      updateModeSelection(DEFAULT_MODE);
    }
  }
}

// Update visual selection
function updateModeSelection(selectedMode) {
  // Remove selected class from all options
  document.querySelectorAll('.mode-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // Add selected class to chosen option
  const selectedOption = document.querySelector(`.mode-option[data-mode="${selectedMode}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }

  // Show/hide Sentinel config panel
  const sentinelConfig = document.getElementById('sentinelConfig');
  if (sentinelConfig) {
    if (selectedMode === 'sentinel') {
      sentinelConfig.classList.remove('hidden');
      loadSentinelConfig();
    } else {
      sentinelConfig.classList.add('hidden');
    }
  }

  // Show/hide Patrol config panel
  const patrolConfig = document.getElementById('patrolConfig');
  if (patrolConfig) {
    if (selectedMode === 'patrol') {
      patrolConfig.classList.remove('hidden');
      loadPatrolConfig();
    } else {
      patrolConfig.classList.add('hidden');
    }
  }
}

// Load Sentinel configuration
async function loadSentinelConfig() {
  try {
    // Load delay
    const delayResult = await chrome.storage.sync.get(['sentinelDelay']);
    const delayInput = document.getElementById('sentinelDelay');
    if (delayInput) {
      delayInput.value = delayResult.sentinelDelay || 3;
    }

    // Load cache duration
    const cacheResult = await chrome.storage.sync.get(['sentinelCacheDuration']);
    const cacheInput = document.getElementById('sentinelCacheDuration');
    if (cacheInput) {
      cacheInput.value = cacheResult.sentinelCacheDuration || 24;
    }

    // Load whitelist
    await loadWhitelist();
  } catch (error) {
    console.error('Error loading Sentinel config:', error);
  }
}

// Load Patrol configuration
async function loadPatrolConfig() {
  try {
    // Load delay
    const delayResult = await chrome.storage.sync.get(['patrolDelay']);
    const delayInput = document.getElementById('patrolDelay');
    if (delayInput) {
      delayInput.value = delayResult.patrolDelay || 3;
    }

    // Load auto-scan domains list
    await loadPatrolAutoScanList();
  } catch (error) {
    console.error('Error loading Patrol config:', error);
  }
}

// Default whitelist domains (same as background.js)
const DEFAULT_WHITELIST_DOMAINS = [
  'google.com',
  'gmail.com',
  'youtube.com',
  'github.com',
  'localhost',
  '127.0.0.1',
  'amazon.com',
  'netflix.com',
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'reddit.com',
  'stackoverflow.com',
  'chrome://',
  'chrome-extension://',
  'edge://',
  'about:'
];

// Initialize whitelist with defaults if empty
async function initializeWhitelist() {
  try {
    const result = await chrome.storage.sync.get(['sentinelWhitelist']);
    if (!result.sentinelWhitelist || result.sentinelWhitelist.length === 0) {
      // Initialize with defaults
      await chrome.storage.sync.set({ sentinelWhitelist: [...DEFAULT_WHITELIST_DOMAINS] });
      console.log('[Settings] Initialized whitelist with defaults');
    }
  } catch (error) {
    console.error('Error initializing whitelist:', error);
  }
}

// Load whitelist
async function loadWhitelist() {
  try {
    // Ensure whitelist is initialized
    await initializeWhitelist();
    
    const result = await chrome.storage.sync.get(['sentinelWhitelist']);
    const whitelist = result.sentinelWhitelist || [];
    const whitelistItems = document.getElementById('whitelistItems');
    
    if (whitelistItems) {
      whitelistItems.innerHTML = '';
      whitelist.forEach(domain => {
        const item = document.createElement('div');
        item.className = 'whitelist-item';
        const isDefault = DEFAULT_WHITELIST_DOMAINS.includes(domain);
        item.innerHTML = `
          <span>${domain}${isDefault ? ' <span style="color: rgba(255,255,255,0.5); font-size: 11px;">(default)</span>' : ''}</span>
          <button class="remove-whitelist-btn" data-domain="${domain}">×</button>
        `;
        whitelistItems.appendChild(item);
      });

      // Add remove handlers
      document.querySelectorAll('.remove-whitelist-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const domain = e.target.dataset.domain;
          await removeFromWhitelist(domain);
        });
      });
    }
  } catch (error) {
    console.error('Error loading whitelist:', error);
  }
}

// Remove from whitelist
async function removeFromWhitelist(domain) {
  try {
    const result = await chrome.storage.sync.get(['sentinelWhitelist']);
    const whitelist = result.sentinelWhitelist || [];
    const filtered = whitelist.filter(d => d !== domain);
    await chrome.storage.sync.set({ sentinelWhitelist: filtered });
    await loadWhitelist();
  } catch (error) {
    console.error('Error removing from whitelist:', error);
  }
}

// Add to whitelist
async function addToWhitelist(domain) {
  if (!domain || domain.trim() === '') {
    return;
  }

  const cleanDomain = domain.trim().toLowerCase().replace('www.', '');
  
  try {
    const result = await chrome.storage.sync.get(['sentinelWhitelist']);
    const whitelist = result.sentinelWhitelist || [];
    
    if (!whitelist.includes(cleanDomain)) {
      whitelist.push(cleanDomain);
      await chrome.storage.sync.set({ sentinelWhitelist: whitelist });
      await loadWhitelist();
      
      const input = document.getElementById('whitelistInput');
      if (input) {
        input.value = '';
      }
    }
  } catch (error) {
    console.error('Error adding to whitelist:', error);
  }
}

// Load Patrol auto-scan list
async function loadPatrolAutoScanList() {
  try {
    const result = await chrome.storage.sync.get(['patrolAutoScanList']);
    const autoScanList = result.patrolAutoScanList || [];
    const itemsContainer = document.getElementById('patrolAutoScanItems');
    
    if (itemsContainer) {
      itemsContainer.innerHTML = '';
      autoScanList.forEach(domain => {
        const item = document.createElement('div');
        item.className = 'whitelist-item';
        item.innerHTML = `
          <span>${domain}</span>
          <button class="remove-whitelist-btn" data-domain="${domain}" data-type="patrol">×</button>
        `;
        itemsContainer.appendChild(item);
      });

      // Add remove handlers
      document.querySelectorAll('.remove-whitelist-btn[data-type="patrol"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const domain = e.target.dataset.domain;
          await removeFromPatrolAutoScanList(domain);
        });
      });
    }
  } catch (error) {
    console.error('Error loading Patrol auto-scan list:', error);
  }
}

// Remove from Patrol auto-scan list
async function removeFromPatrolAutoScanList(domain) {
  try {
    const result = await chrome.storage.sync.get(['patrolAutoScanList']);
    const autoScanList = result.patrolAutoScanList || [];
    const filtered = autoScanList.filter(d => d !== domain);
    await chrome.storage.sync.set({ patrolAutoScanList: filtered });
    await loadPatrolAutoScanList();
  } catch (error) {
    console.error('Error removing from Patrol auto-scan list:', error);
  }
}

// Add to Patrol auto-scan list
async function addToPatrolAutoScanList(domain) {
  if (!domain || domain.trim() === '') {
    return;
  }

  const cleanDomain = domain.trim().toLowerCase().replace('www.', '');
  
  try {
    const result = await chrome.storage.sync.get(['patrolAutoScanList']);
    const autoScanList = result.patrolAutoScanList || [];
    
    if (!autoScanList.includes(cleanDomain)) {
      autoScanList.push(cleanDomain);
      await chrome.storage.sync.set({ patrolAutoScanList: autoScanList });
      await loadPatrolAutoScanList();
      
      const input = document.getElementById('patrolAutoScanInput');
      if (input) {
        input.value = '';
      }
    }
  } catch (error) {
    console.error('Error adding to Patrol auto-scan list:', error);
  }
}

// Save mode to storage
async function saveMode() {
  const selectedRadio = document.querySelector('input[name="detection-mode"]:checked');
  if (!selectedRadio) {
    showStatus('Please select a mode', 'error');
    return;
  }
  
  const selectedMode = selectedRadio.value;
  
  try {
    // Save mode
    await chrome.storage.sync.set({ detectionMode: selectedMode });
    
    // Save Sentinel config if Sentinel mode is selected
    if (selectedMode === 'sentinel') {
      const delayInput = document.getElementById('sentinelDelay');
      const cacheInput = document.getElementById('sentinelCacheDuration');
      
      if (delayInput) {
        const delay = parseInt(delayInput.value) || 3;
        await chrome.storage.sync.set({ sentinelDelay: delay });
      }
      
      if (cacheInput) {
        const cacheDuration = parseInt(cacheInput.value) || 24;
        await chrome.storage.sync.set({ sentinelCacheDuration: cacheDuration });
      }
    }

    // Save Patrol config if Patrol mode is selected
    if (selectedMode === 'patrol') {
      const delayInput = document.getElementById('patrolDelay');
      
      if (delayInput) {
        const delay = parseInt(delayInput.value) || 3;
        await chrome.storage.sync.set({ patrolDelay: delay });
      }
    }
    
    showStatus('Settings saved successfully!', 'success');
    
    // Update visual selection
    updateModeSelection(selectedMode);
    
    // Notify other extension pages (like popup) that mode changed
    // This will trigger chrome.storage.onChanged in popup.js if it's open
    chrome.runtime.sendMessage({ action: 'modeChanged', mode: selectedMode }).catch(() => {
      // Ignore errors - popup might not be open
    });
    
    // Clear status after 2 seconds
    setTimeout(() => {
      hideStatus();
    }, 2000);
  } catch (error) {
    console.error('Error saving mode:', error);
    showStatus('Failed to save settings. Please try again.', 'error');
  }
}

// Clear cache
async function clearCache() {
  try {
    await chrome.storage.local.set({ sentinelCache: {} });
    showStatus('Cache cleared successfully!', 'success');
    setTimeout(() => hideStatus(), 2000);
  } catch (error) {
    console.error('Error clearing cache:', error);
    showStatus('Failed to clear cache.', 'error');
  }
}

// Reset rate limits (removed - no longer using rate limits)
// Kept for backward compatibility but does nothing
async function resetRateLimits() {
  showStatus('Rate limits have been removed. History-based checking is now used.', 'success');
  setTimeout(() => hideStatus(), 3000);
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.classList.remove('hidden');
}

// Hide status message
function hideStatus() {
  const statusEl = document.getElementById('statusMessage');
  statusEl.classList.add('hidden');
}

// Navigate back to popup
function goBack() {
  window.close();
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Load current mode
  loadCurrentMode();
  
  // Handle radio button changes
  document.querySelectorAll('input[name="detection-mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateModeSelection(e.target.value);
    });
  });
  
  // Handle mode option clicks (click anywhere on the card)
  document.querySelectorAll('.mode-option').forEach(option => {
    option.addEventListener('click', (e) => {
      // Don't trigger if clicking the radio button itself
      if (e.target.type !== 'radio') {
        const mode = option.dataset.mode;
        const radio = document.getElementById(`mode-${mode}`);
        if (radio) {
          radio.checked = true;
          updateModeSelection(mode);
        }
      }
    });
  });
  
  // Save button
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveMode);
  }
  
  // Back button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', goBack);
  }

  // Sentinel config handlers
  const addWhitelistBtn = document.getElementById('addWhitelistBtn');
  const whitelistInput = document.getElementById('whitelistInput');
  if (addWhitelistBtn && whitelistInput) {
    addWhitelistBtn.addEventListener('click', () => {
      addToWhitelist(whitelistInput.value);
    });
    whitelistInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addToWhitelist(whitelistInput.value);
      }
    });
  }

  const clearCacheBtn = document.getElementById('clearCacheBtn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', clearCache);
  }

  // Patrol config handlers
  const addPatrolAutoScanBtn = document.getElementById('addPatrolAutoScanBtn');
  const patrolAutoScanInput = document.getElementById('patrolAutoScanInput');
  if (addPatrolAutoScanBtn && patrolAutoScanInput) {
    addPatrolAutoScanBtn.addEventListener('click', () => {
      addToPatrolAutoScanList(patrolAutoScanInput.value);
    });
    patrolAutoScanInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addToPatrolAutoScanList(patrolAutoScanInput.value);
      }
    });
  }

  // Rate limits removed - history-based checking is now used

  // Load Sentinel config if Sentinel mode is selected
  loadCurrentMode().then(() => {
    const selectedRadio = document.querySelector('input[name="detection-mode"]:checked');
    if (selectedRadio && selectedRadio.value === 'sentinel') {
      loadSentinelConfig();
    }
  });
});

