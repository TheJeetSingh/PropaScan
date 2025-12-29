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
    await chrome.storage.sync.set({ detectionMode: selectedMode });
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
});

