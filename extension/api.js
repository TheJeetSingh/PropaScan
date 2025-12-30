// Hack Club AI API Integration for PropaScan
// Note: API requests are made via background service worker to avoid CORS issues
// Configuration is loaded from config.js and passed to background worker
// System prompt is defined in background.js to avoid duplication

/**
 * Analyze content using Hack Club AI via background service worker
 * This avoids CORS issues by making requests from the background script
 * @param {string} textContent - Text content to analyze (optional)
 * @param {string} imageDataUrl - Base64 image data URL (optional)
 * @returns {Promise<Object>} Analysis result in JSON format
 */
async function analyzeContent(textContent = '', imageDataUrl = '') {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: 'analyzeContent',
      data: {
        textContent: textContent,
        imageDataUrl: imageDataUrl,
        config: window.PropaScanConfig
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response && response.error) {
        reject(new Error(response.error));
        return;
      }
      if (response && response.result) {
        resolve(response.result);
        return;
      }
      reject(new Error('Invalid response from background script'));
    });
  });
}

// Export for use in popup.js
window.PropaScanAPI = { analyzeContent };
