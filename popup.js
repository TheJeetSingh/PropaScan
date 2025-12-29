// PropaScan Extension
console.log('PropaScan Extension loaded!');

// Global variable to store current tab ID for tab-specific storage
let currentTabId = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM loaded');

  // Get DOM elements
  const imagePreview = document.getElementById('imagePreview');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const previewSection = document.getElementById('previewSection');
  const clearPreviewBtn = document.getElementById('clearPreviewBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');
  const selectAreaBtn = document.getElementById('selectAreaBtn');
  const scanPageBtn = document.getElementById('scanPageBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const modeName = document.getElementById('modeName');
  const pageInfoSection = document.getElementById('pageInfoSection');
  const pageTitle = document.getElementById('pageTitle');
  const pageUrl = document.getElementById('pageUrl');
  const showHighlightsBtn = document.getElementById('showHighlightsBtn');
  const instanceCount = document.getElementById('instanceCount');

  // Load current page info
  loadCurrentPageInfo();

  // Scan page (Patrol Mode) button handler
  if (scanPageBtn) {
    scanPageBtn.addEventListener('click', async () => {
      await handleScanPage();
    });
  }

  // Select area (screenshot) button handler
  if (selectAreaBtn) {
    selectAreaBtn.addEventListener('click', async () => {
      await handleSelectArea();
    });
  }

  // Analyze button handler
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      await handleAnalyze();
    });
  }

  // Clear preview button handler
  if (clearPreviewBtn) {
    clearPreviewBtn.addEventListener('click', () => {
      clearPreview();
    });
  }

  // Clear all button handler
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      clearPreview();
      clearResults();
    });
  }

  // Settings button handler
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    });
  }

  // History button handler
  const historyBtn = document.getElementById('historyBtn');
  if (historyBtn) {
    historyBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
    });
  }

  // Show highlights button handler
  if (showHighlightsBtn) {
    let highlightsActive = false;
    
    showHighlightsBtn.addEventListener('click', async () => {
      if (currentInstances.length === 0) {
        showError('No instances to highlight');
        return;
      }

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          showError('Could not access current tab');
          return;
        }

        if (!highlightsActive) {
          // Inject highlighter script and CSS
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['highlighter.js']
            });
            
            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ['highlighter.css']
            });

            // Wait a bit for injection
            await new Promise(resolve => setTimeout(resolve, 200));

            // Send instances to highlighter
            console.log('[Popup] Sending instances to highlighter:', currentInstances.length);
            console.log('[Popup] Instance preview:', currentInstances.map(inst => ({
              type: inst.element_type,
              technique: inst.technique,
              elementPreview: inst.element ? inst.element.substring(0, 50) : 'none'
            })));
            
            chrome.tabs.sendMessage(tab.id, {
              action: 'showHighlights',
              instances: currentInstances
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('[Popup] Error showing highlights:', chrome.runtime.lastError);
                showError('Failed to show highlights. Please try again.');
                return;
              }

              if (response && response.success) {
                console.log('[Popup] Highlights shown successfully');
                highlightsActive = true;
                showHighlightsBtn.classList.add('active');
                showHighlightsBtn.textContent = 'Hide Highlights';
              } else {
                console.warn('[Popup] No response or response not successful');
              }
            });
          } catch (injectError) {
            console.error('Error injecting highlighter:', injectError);
            showError('Failed to inject highlighter. Please refresh the page and try again.');
          }
        } else {
          // Hide highlights
          chrome.tabs.sendMessage(tab.id, {
            action: 'hideHighlights'
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error hiding highlights:', chrome.runtime.lastError);
              // Try to clear instead
              chrome.tabs.sendMessage(tab.id, { action: 'clearHighlights' }).catch(() => {});
            }

            highlightsActive = false;
            showHighlightsBtn.classList.remove('active');
            showHighlightsBtn.textContent = 'Show on Page';
          });
        }
      } catch (error) {
        console.error('Error toggling highlights:', error);
        showError('Failed to toggle highlights: ' + error.message);
      }
    });
  }

  // Load and display current mode
  loadCurrentMode();

  // Save config to sync storage for Sentinel mode (background worker needs it)
  if (window.PropaScanConfig) {
    chrome.storage.sync.set({ propaScanConfig: window.PropaScanConfig }, () => {
      console.log('[Popup] Config saved to sync storage for Sentinel mode');
    });
  } else {
    console.warn('[Popup] PropaScanConfig not found - Sentinel mode may not work until popup is opened');
  }

  // Check for Sentinel mode and load cached results
  checkSentinelMode();

  // Handle select area action (for screenshot)
  async function handleSelectArea() {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        alert('Area selection is not available on this page. Please navigate to a regular webpage.');
        return;
      }

      // Ensure content script is injected
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'startAreaSelection' });
      } catch (injectError) {
        // Content script might not be loaded, inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
        // Try again after injection
        await new Promise(resolve => setTimeout(resolve, 100));
        await chrome.tabs.sendMessage(tab.id, { action: 'startAreaSelection' });
      }
      
      // Close popup to allow user to select area
      window.close();
    } catch (error) {
      console.error('Error starting area selection:', error);
      alert('Error starting area selection. Please make sure you\'re on a regular webpage and try again.');
    }
  }

  // Handle analyze action
  async function handleAnalyze() {
    const imageDataUrl = imagePreview.src;
    const hasValidImage = imageDataUrl && imageDataUrl.startsWith('data:image');

    // Validate that screenshot is provided (everything is now image-based)
    if (!hasValidImage) {
      showError('Please capture a screenshot first.');
      return;
    }

    // Get current tab ID
    if (!currentTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabId = tab?.id;
    }

    if (!currentTabId) {
      showError('Could not determine current tab');
      return;
    }

    // Show loading state
    setLoading(true);
    hideError();
    resultsSection.classList.remove('hidden');

    // Clear the selected screenshot (it's being consumed for analysis)
    // This prevents it from reappearing when switching tabs
    await chrome.storage.local.remove([
      `selectedScreenshot_${currentTabId}`,
      `selectionType_${currentTabId}`
    ]);

    // Get current tab info for history
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab?.url || '';
    const currentTitle = tab?.title || '';
    let currentDomain = '';
    try {
      if (currentUrl && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
        currentDomain = new URL(currentUrl).hostname.replace('www.', '');
      }
    } catch (e) {
      console.warn('Could not parse URL for domain:', currentUrl);
    }

    // Save original content and mark analysis as in progress with tab-specific keys
    await chrome.storage.local.set({
      [`analysisStatus_${currentTabId}`]: 'in_progress',
      [`originalImage_${currentTabId}`]: imageDataUrl,
      [`originalText_${currentTabId}`]: '', // Empty since we're only using images now
      [`scanMetadata_${currentTabId}`]: {
        url: currentUrl,
        title: currentTitle,
        domain: currentDomain,
        timestamp: Date.now()
      }
    });

    try {
      // Call the API directly with URL/metadata for history tracking
      // We bypass the API wrapper to include URL and metadata
      const analysisPromise = new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'analyzeContent',
          data: {
            textContent: '',
            imageDataUrl: imageDataUrl,
            config: window.PropaScanConfig,
            systemPrompt: window.PropaScanAPI?.getSystemPrompt() || '',
            url: currentUrl,
            title: currentTitle,
            metadata: {
              url: currentUrl,
              title: currentTitle,
              domain: currentDomain,
              timestamp: Date.now()
            }
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

      const result = await analysisPromise;

      // Results are already saved by background worker, just display them
      displayResults(result);
    } catch (error) {
      console.error('Analysis error:', error);
      showError(`Analysis failed: ${error.message}`);

      // Error is already saved by background worker
    } finally {
      setLoading(false);
    }
  }

  // Display analysis results
  async function displayResults(result) {
    let html = '';

    // Get current tab ID if not already set
    if (!currentTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabId = tab?.id;
    }

    // Load scan metadata if available (Patrol Mode) using tab-specific key
    const metadata = await new Promise((resolve) => {
      if (!currentTabId) {
        resolve(null);
        return;
      }
      chrome.storage.local.get([`scanMetadata_${currentTabId}`], (data) => {
        resolve(data[`scanMetadata_${currentTabId}`] || null);
      });
    });

    // Show source info if available (Patrol Mode)
    if (metadata) {
      html += '<div class="source-info">';
      html += `<p class="source-title"><strong>Scanned:</strong> ${escapeHtml(metadata.title || 'Untitled Page')}</p>`;
      html += `<p class="source-url"><strong>URL:</strong> <a href="${escapeHtml(metadata.url)}" target="_blank" class="source-link">${escapeHtml(metadata.url)}</a></p>`;
      html += `<p class="source-domain"><strong>Domain:</strong> ${escapeHtml(metadata.domain || 'Unknown')}</p>`;
      if (metadata.timestamp) {
        const scanDate = new Date(metadata.timestamp);
        html += `<p class="source-time"><strong>Scanned:</strong> ${scanDate.toLocaleString()}</p>`;
      }
      html += '</div>';
    }

    // Overall summary
    html += '<div class="result-summary">';
    html += `<div class="summary-item"><strong>Contains Propaganda:</strong> ${result.contains_propaganda ? 'Yes' : 'No'}</div>`;
    if (result.tier) {
      html += `<div class="summary-item"><strong>Tier:</strong> <span class="tier-badge tier-${result.tier}">Tier ${result.tier}</span></div>`;
      if (result.tier_justification) {
        html += `<div class="summary-item tier-justification"><strong>Tier Justification:</strong> ${result.tier_justification}</div>`;
      }
    }
    html += `<div class="summary-item"><strong>Manipulation Score:</strong> ${result.manipulation_score || 0}/100</div>`;
    html += `<div class="summary-item"><strong>Overall Severity:</strong> <span class="severity-${result.overall_severity || 'none'}">${(result.overall_severity || 'none').toUpperCase()}</span></div>`;
    html += `<div class="summary-item"><strong>Political Leaning:</strong> ${result.political_leaning || 'none'}</div>`;
    html += `<div class="summary-item"><strong>Source Credibility:</strong> ${result.source_credibility || 'unverified'}</div>`;
    html += '</div>';

    // Analysis details
    if (result.analysis) {
      html += '<div class="analysis-details">';
      
      if (result.analysis.text_analysis) {
        html += '<div class="analysis-block">';
        html += '<h3>Text Analysis</h3>';
        html += `<p><strong>Tone:</strong> ${result.analysis.text_analysis.tone || 'N/A'}</p>`;
        html += `<p><strong>Framing:</strong> ${result.analysis.text_analysis.framing || 'N/A'}</p>`;
        html += `<p><strong>Missing Context:</strong> ${result.analysis.text_analysis.missing_context || 'N/A'}</p>`;
        if (result.analysis.text_analysis.factual_accuracy) {
          html += `<p><strong>Factual Accuracy:</strong> ${result.analysis.text_analysis.factual_accuracy}</p>`;
        }
        html += '</div>';
      }

      if (result.analysis.visual_analysis) {
        html += '<div class="analysis-block">';
        html += '<h3>Visual Analysis</h3>';
        html += `<p><strong>Dominant Colors:</strong> ${(result.analysis.visual_analysis.dominant_colors || []).join(', ') || 'N/A'}</p>`;
        html += `<p><strong>Psychological Intent:</strong> ${result.analysis.visual_analysis.psychological_intent || 'N/A'}</p>`;
        html += `<p><strong>Composition:</strong> ${result.analysis.visual_analysis.composition || 'N/A'}</p>`;
        html += '</div>';
      }
      
      html += '</div>';
    }

    // Instances of manipulation
    if (result.instances && result.instances.length > 0) {
      html += '<div class="instances-section">';
      html += '<h3>Detected Manipulation Techniques</h3>';
      html += '<div class="instances-list">';
      result.instances.forEach((instance, index) => {
        html += '<div class="instance-item">';
        html += `<div class="instance-header">`;
        html += `<span class="instance-number">#${index + 1}</span>`;
        html += `<span class="technique-tag">${instance.technique}</span>`;
        if (instance.severity_weight) {
          html += `<span class="severity-weight severity-${instance.severity_weight}">${instance.severity_weight}</span>`;
        }
        html += `<span class="confidence-badge confidence-${instance.confidence}">${instance.confidence}</span>`;
        html += `</div>`;
        html += `<div class="instance-element"><strong>Element:</strong> ${instance.element}</div>`;
        html += `<div class="instance-explanation">${instance.explanation}</div>`;
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    }

    // Text-visual synergy (if both are present)
    if (result.text_visual_synergy) {
      html += '<div class="synergy-section">';
      html += '<h3>Text-Visual Synergy</h3>';
      html += `<p>${result.text_visual_synergy}</p>`;
      html += '</div>';
    }

    // Target audience and intended effect
    if (result.target_audience || result.intended_effect) {
      html += '<div class="impact-section">';
      html += '<h3>Target Audience & Intended Effect</h3>';
      if (result.target_audience) {
        html += `<p><strong>Target Audience:</strong> ${result.target_audience}</p>`;
      }
      if (result.intended_effect) {
        html += `<p><strong>Intended Effect:</strong> ${result.intended_effect}</p>`;
      }
      html += '</div>';
    }

    // Credibility red flags
    if (result.credibility_red_flags && result.credibility_red_flags.length > 0) {
      html += '<div class="red-flags-section">';
      html += '<h3>Credibility Red Flags</h3>';
      html += '<ul class="red-flags-list">';
      result.credibility_red_flags.forEach(flag => {
        html += `<li>${flag}</li>`;
      });
      html += '</ul>';
      html += '</div>';
    }

    // Neutral rewrite (if available)
    if (result.neutral_rewrite) {
      html += '<div class="neutral-rewrite-section">';
      html += '<h3>Neutral Rewrite</h3>';
      html += `<p class="neutral-rewrite-text">${result.neutral_rewrite}</p>`;
      html += '</div>';
    }

    resultsContent.innerHTML = html;
    
    // Update instance count and show highlights button
    updateInstanceCount(result.instances || []);
  }
  
  // Store current instances for highlighting
  let currentInstances = [];
  
  // Update instance count display
  function updateInstanceCount(instances) {
    if (!instanceCount || !showHighlightsBtn) return;
    
    const count = instances.length;
    if (count > 0) {
      instanceCount.textContent = `${count} instance${count !== 1 ? 's' : ''} found`;
      instanceCount.classList.remove('hidden');
      showHighlightsBtn.classList.remove('hidden');
      
      // Store instances for highlighting
      currentInstances = instances;
    } else {
      instanceCount.classList.add('hidden');
      showHighlightsBtn.classList.add('hidden');
      currentInstances = [];
    }
  }

  // Set loading state
  function setLoading(isLoading) {
    if (isLoading) {
      loadingIndicator.classList.remove('hidden');
      resultsContent.innerHTML = '';
    } else {
      loadingIndicator.classList.add('hidden');
    }
    if (analyzeBtn) {
      analyzeBtn.disabled = isLoading;
    }
  }

  // Update loading message
  function updateLoadingMessage(message) {
    const loadingText = loadingIndicator.querySelector('p');
    if (loadingText) {
      loadingText.textContent = message;
    }
    console.log('[PropaScan]', message);
  }

  // Show error message
  function showError(message) {
    console.error('[PropaScan] Error:', message);
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
    }
    if (resultsContent) {
      resultsContent.innerHTML = '';
    }
    // Scroll to error message
    if (errorMessage) {
      setTimeout(() => {
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }

  // Hide error message
  function hideError() {
    errorMessage.classList.add('hidden');
  }

  // Clear preview
  function clearPreview() {
    imagePreview.src = '';
    previewSection.classList.add('hidden');
    clearSavedContent();
  }

  // Clear saved content from storage
  async function clearSavedContent() {
    if (!currentTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabId = tab?.id;
    }
    if (currentTabId) {
      chrome.storage.local.remove([`selectedScreenshot_${currentTabId}`, `selectionType_${currentTabId}`], () => {
        console.log('Saved selection cleared for tab', currentTabId);
      });
    }
  }

  // Load saved results from storage and check for pending analysis
  async function loadSavedResults() {
    // Get current tab ID first
    if (!currentTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabId = tab?.id;
    }

    if (!currentTabId) {
      console.log('Could not get tab ID for loading results');
      return;
    }

    // Use tab-specific storage keys
    const storageKeys = [
      `analysisResult_${currentTabId}`,
      `analysisStatus_${currentTabId}`,
      `analysisError_${currentTabId}`,
      `originalImage_${currentTabId}`,
      `selectedScreenshot_${currentTabId}`,
      `selectionType_${currentTabId}`
    ];

    chrome.storage.local.get(storageKeys, (data) => {
      const analysisResult = data[`analysisResult_${currentTabId}`];
      const analysisStatus = data[`analysisStatus_${currentTabId}`];
      const analysisError = data[`analysisError_${currentTabId}`];
      const originalImage = data[`originalImage_${currentTabId}`];
      const selectedScreenshot = data[`selectedScreenshot_${currentTabId}`];
      const selectionType = data[`selectionType_${currentTabId}`];

      // Check if there's a screenshot from content script
      if (selectedScreenshot && selectionType === 'screenshot') {
        // Display the screenshot - keep it in storage until user clears or analyzes
        imagePreview.src = selectedScreenshot;
        previewSection.classList.remove('hidden');
        // Scroll to preview section only on first load (when switching from different tab)
        if (!imagePreview.src || imagePreview.src !== selectedScreenshot) {
          setTimeout(() => {
            previewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }

      // Restore original image if it exists (for persistent results)
      // This includes images from Patrol Mode scans
      if (originalImage && !selectedScreenshot) {
        imagePreview.src = originalImage;
        previewSection.classList.remove('hidden');
        console.log('[PropaScan] Restored original image from storage');
      }

      // Only show results if results section is not already visible (to avoid conflicts with Sentinel mode)
      const resultsAlreadyShown = !resultsSection.classList.contains('hidden');

      if (analysisStatus === 'in_progress' && !resultsAlreadyShown) {
        // Analysis is still running in background
        console.log('Analysis in progress, showing loading state');
        resultsSection.classList.remove('hidden');
        setLoading(true);

        // Poll for results (check every second)
        const checkInterval = setInterval(() => {
          const pollKeys = [
            `analysisResult_${currentTabId}`,
            `analysisStatus_${currentTabId}`,
            `analysisError_${currentTabId}`
          ];
          chrome.storage.local.get(pollKeys, (checkData) => {
            const status = checkData[`analysisStatus_${currentTabId}`];
            const result = checkData[`analysisResult_${currentTabId}`];
            const error = checkData[`analysisError_${currentTabId}`];

            if (status === 'completed' && result) {
              clearInterval(checkInterval);
              setLoading(false);
              displayResults(result);
            } else if (status === 'error') {
              clearInterval(checkInterval);
              setLoading(false);
              showError(error || 'Analysis failed');
            }
          });
        }, 1000);

        // Stop polling after 2 minutes (timeout)
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 120000);

      } else if (analysisResult && analysisStatus === 'completed' && !resultsAlreadyShown) {
        // Results are ready (only show if not already showing Sentinel results)
        console.log('Loading saved analysis results');
        resultsSection.classList.remove('hidden');
        displayResults(analysisResult);
      } else if (analysisStatus === 'error' && !resultsAlreadyShown) {
        // Show error if it exists (only if not already showing results)
        resultsSection.classList.remove('hidden');
        showError(analysisError || 'Analysis failed');
      }
    });
  }

  // Clear saved results from storage
  async function clearSavedResults() {
    if (!currentTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabId = tab?.id;
    }
    if (currentTabId) {
      chrome.storage.local.remove([
        `analysisResult_${currentTabId}`,
        `analysisStatus_${currentTabId}`,
        `analysisError_${currentTabId}`,
        `originalImage_${currentTabId}`,
        `scanMetadata_${currentTabId}`
      ], () => {
        console.log('Saved analysis results, status, and original content cleared for tab', currentTabId);
      });
    }
  }

  // Clear results
  function clearResults() {
    resultsSection.classList.add('hidden');
    resultsContent.innerHTML = '';
    hideError();
    setLoading(false);
    clearSavedResults();
    
    // Clear highlights if active
    if (showHighlightsBtn && showHighlightsBtn.classList.contains('active')) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'clearHighlights' });
        }
      });
      showHighlightsBtn.classList.remove('active');
      showHighlightsBtn.textContent = 'Show on Page';
    }
    
    // Reset instance count
    if (instanceCount) {
      instanceCount.classList.add('hidden');
    }
    if (showHighlightsBtn) {
      showHighlightsBtn.classList.add('hidden');
    }
    currentInstances = [];
  }

  // Load current detection mode from storage
  async function loadCurrentMode() {
    try {
      const result = await chrome.storage.sync.get(['detectionMode']);
      const mode = result.detectionMode || 'patrol'; // Default to patrol
      
      // Map mode values to display names
      const modeNames = {
        'sentinel': 'Sentinel',
        'patrol': 'Patrol',
        'targetscan': 'TargetScan'
      };
      
      const displayName = modeNames[mode] || 'Patrol';
      if (modeName) {
        modeName.textContent = displayName;
      }
    } catch (error) {
      console.error('Error loading mode:', error);
      if (modeName) {
        modeName.textContent = 'Patrol';
      }
    }
  }

  // Listen for storage changes to update mode display
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.detectionMode) {
      const newMode = changes.detectionMode.newValue || 'patrol';
      const modeNames = {
        'sentinel': 'Sentinel',
        'patrol': 'Patrol',
        'targetscan': 'TargetScan'
      };
      const displayName = modeNames[newMode] || 'Patrol';
      if (modeName) {
        modeName.textContent = displayName;
      }
    }
  });

  // Load current page info
  async function loadCurrentPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Set currentTabId early so it's available for storage operations
      if (tab && tab.id) {
        currentTabId = tab.id;
      }
      
      if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        // Valid webpage
        if (pageTitle) {
          pageTitle.textContent = tab.title || 'Untitled Page';
        }
        if (pageUrl) {
          pageUrl.textContent = tab.url;
        }
        if (pageInfoSection) {
          pageInfoSection.classList.remove('hidden');
        }
        if (scanPageBtn) {
          scanPageBtn.disabled = false;
        }
      } else {
        // Not a valid webpage
        if (pageInfoSection) {
          pageInfoSection.classList.add('hidden');
        }
        if (scanPageBtn) {
          scanPageBtn.disabled = true;
        }
      }
    } catch (error) {
      console.error('Error loading page info:', error);
      if (pageInfoSection) {
        pageInfoSection.classList.add('hidden');
      }
    }
  }

  // Handle scan page action (Patrol Mode)
  async function handleScanPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        showError('Page scanning is not available on this page. Please navigate to a regular webpage.');
        return;
      }

      // Set current tab ID
      if (!currentTabId) {
        currentTabId = tab.id;
      }

      // Clear any pending screenshot selections (they're being replaced by page scan)
      await chrome.storage.local.remove([
        `selectedScreenshot_${currentTabId}`,
        `selectionType_${currentTabId}`
      ]);

      // Show loading state
      setLoading(true);
      hideError();
      resultsSection.classList.remove('hidden');
      updateLoadingMessage('Scanning page...');

      // Disable scan button during process
      if (scanPageBtn) {
        scanPageBtn.disabled = true;
        const originalText = scanPageBtn.innerHTML;
        scanPageBtn.innerHTML = '<span style="opacity: 0.7;">Scanning...</span>';
      }

      // Trigger the scan in background (it will continue even if popup closes)
      chrome.runtime.sendMessage({
        action: 'performPatrolScan',
        tabId: tab.id,
        url: tab.url
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Patrol] Failed to start scan:', chrome.runtime.lastError);
          setLoading(false);
          resetScanButton();
          showError('Failed to start scan: ' + chrome.runtime.lastError.message);
          return;
        }

        if (!response || !response.success) {
          console.error('[Patrol] Scan rejected by background');
          setLoading(false);
          resetScanButton();
          showError('Failed to start scan');
          return;
        }

        console.log('[Patrol] Scan started in background, polling for results...');
        pollForPatrolResults();
      });

      // Poll for results function (works even if popup was closed and reopened)
      function pollForPatrolResults() {
        const checkInterval = setInterval(() => {
          const pollKeys = [
            `analysisStatus_${currentTabId}`,
            `analysisResult_${currentTabId}`,
            `analysisError_${currentTabId}`
          ];

          chrome.storage.local.get(pollKeys, (checkData) => {
            const status = checkData[`analysisStatus_${currentTabId}`];
            const result = checkData[`analysisResult_${currentTabId}`];
            const error = checkData[`analysisError_${currentTabId}`];

            if (status === 'completed' && result) {
              console.log('[Patrol] Analysis completed successfully');
              clearInterval(checkInterval);
              setLoading(false);
              resetScanButton();
              displayResults(result);
            } else if (status === 'error') {
              console.error('[Patrol] Analysis failed:', error);
              clearInterval(checkInterval);
              setLoading(false);
              resetScanButton();
              showError(error || 'Analysis failed');
            }
            // Otherwise keep polling (status is 'in_progress')
          });
        }, 1000); // Check every second

        // Stop polling after 3 minutes (timeout)
        setTimeout(() => {
          clearInterval(checkInterval);
          setLoading(false);
          resetScanButton();
        }, 180000);
      }

      // Inject page extractor script if needed
      let needsInjection = true;
      try {
        // Try to send message first (script might already be loaded)
        updateLoadingMessage('Step 1: Checking if extractor is ready...');
        const testResponse = await chrome.tabs.sendMessage(tab.id, { action: 'extractPageContent' });
        if (testResponse && testResponse.success) {
          // Script is loaded and we got a response, use it
          needsInjection = false;
          updateLoadingMessage('Step 2: Extracting content from page...');
          handleExtractionResponse(testResponse);
        }
      } catch (injectError) {
        // Script not loaded, will inject below
        console.log('[PropaScan] Extractor not loaded, injecting...');
        needsInjection = true;
      }

      if (needsInjection) {
        // Script not loaded, inject it
        updateLoadingMessage('Step 1: Injecting page extractor...');
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['pageExtractor.js']
          });
        } catch (injectionError) {
          console.error('[PropaScan] Failed to inject extractor:', injectionError);
          setLoading(false);
          resetScanButton();
          showError(`Cannot inject script on this page: ${injectionError.message}. This might be due to page restrictions.`);
          return;
        }
        
        // Wait longer for injection and script initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateLoadingMessage('Step 2: Extracting content from page...');
        // Request page extraction from content script with retry logic
        let retries = 3;
        let extractionSuccess = false;
        
        while (retries > 0 && !extractionSuccess) {
          try {
            const response = await new Promise((resolve, reject) => {
              chrome.tabs.sendMessage(tab.id, { action: 'extractPageContent' }, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            });
            
            if (response) {
              extractionSuccess = true;
              await handleExtractionResponse(response);
            } else {
              throw new Error('No response from content script');
            }
          } catch (msgError) {
            retries--;
            if (retries > 0) {
              console.log(`[PropaScan] Extraction message failed, retrying... (${retries} retries left)`);
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.error('[PropaScan] Extraction failed after retries:', msgError);
              setLoading(false);
              resetScanButton();
              showError(`Failed to extract page content: ${msgError.message}. Please try again.`);
            }
          }
        }
      }

      // Handle extraction response
      async function handleExtractionResponse(response) {
        if (chrome.runtime.lastError) {
          console.error('[PropaScan] Error extracting page:', chrome.runtime.lastError);
          setLoading(false);
          resetScanButton();
          showError(`Failed to extract page content: ${chrome.runtime.lastError.message}. Please try again.`);
          return;
        }

        if (!response || !response.success) {
          console.error('[PropaScan] Extraction failed:', response?.error);
          setLoading(false);
          resetScanButton();
          showError(response?.error || 'Failed to extract page content. Please try again.');
          return;
        }

        console.log('[PropaScan] Content extracted successfully');
        updateLoadingMessage('Step 3: Analyzing content with AI...');

        const { text, images, metadata } = response.content;

        // Debug logging
        console.log('[PropaScan] Extracted text length:', text?.length || 0);
        console.log('[PropaScan] First 500 chars:', text?.substring(0, 500) || 'NO TEXT');
        console.log('[PropaScan] Number of images:', images?.length || 0);
        console.log('[PropaScan] Full extraction response:', { 
          textLength: text?.length, 
          imageCount: images?.length,
          hasText: !!text && text.trim().length > 0,
          hasImages: !!images && images.length > 0
        });

        // Validate we have content
        if (!text || text.trim().length === 0) {
          console.warn('[PropaScan] No text content found');
          setLoading(false);
          resetScanButton();
          showError('No text content found on this page. Please try a different page or use the screenshot feature.');
          return;
        }

        console.log(`[PropaScan] Extracted ${text.length} characters and ${images.length} images`);

        // Get current tab ID
        if (!currentTabId) {
          currentTabId = tab.id;
        }

        // Save metadata for display with tab-specific keys
        await chrome.storage.local.set({
          [`scanMetadata_${currentTabId}`]: metadata,
          scanText: text,
          scanImages: images
        });

        // Store URL and title for history
        const currentUrl = metadata.url || tab.url;
        const currentTitle = metadata.title || tab.title || '';

        // Send to background for analysis
        // For Patrol Mode, we'll send text + images to API
        // Convert images to a format the API can use
        // Gemini 3 Pro can handle multiple images, so we'll send more
        const imageDataUrls = [];
        for (const img of images.slice(0, 10)) { // Limit to 10 images for API (increased from 5)
          if (img.src && !img.isUrl) {
            imageDataUrls.push(img.src); // Already base64
          }
        }

        // Use the first image if available, otherwise send text only
        const primaryImage = imageDataUrls.length > 0 ? imageDataUrls[0] : '';

        console.log('[PropaScan] Sending to API:', {
          textLength: text.length,
          hasImage: !!primaryImage,
          imagePreview: primaryImage ? primaryImage.substring(0, 50) + '...' : 'none'
        });

        // Save for analysis with tab-specific keys
        await chrome.storage.local.set({
          [`analysisStatus_${currentTabId}`]: 'in_progress',
          [`originalText_${currentTabId}`]: text,
          [`originalImage_${currentTabId}`]: primaryImage,
          [`scanMetadata_${currentTabId}`]: metadata
        });

      // Trigger analysis via background
      updateLoadingMessage('Step 3: Sending to AI for analysis...');
      chrome.runtime.sendMessage({
        action: 'analyzeContent',
        data: {
          textContent: text, // Make sure text is included!
          imageDataUrl: primaryImage,
          config: window.PropaScanConfig,
          systemPrompt: window.PropaScanAPI?.SYSTEM_PROMPT || '',
          url: currentUrl,
          title: currentTitle,
          metadata: metadata // Include full metadata for proper storage
        }
      }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[PropaScan] Failed to start analysis:', chrome.runtime.lastError);
            setLoading(false);
            resetScanButton();
            showError('Failed to start analysis: ' + chrome.runtime.lastError.message);
            return;
          }

          if (response && response.error) {
            console.error('[PropaScan] Analysis error:', response.error);
            setLoading(false);
            resetScanButton();
            showError(response.error);
            return;
          }

          console.log('[PropaScan] Analysis started, waiting for results...');
          updateLoadingMessage('Step 4: Waiting for AI analysis results...');

          // Poll for results using tab-specific keys
          const checkInterval = setInterval(async () => {
            const pollKeys = [
              `analysisStatus_${currentTabId}`,
              `analysisResult_${currentTabId}`,
              `analysisError_${currentTabId}`
            ];
            chrome.storage.local.get(pollKeys, (checkData) => {
              const status = checkData[`analysisStatus_${currentTabId}`];
              const result = checkData[`analysisResult_${currentTabId}`];
              const error = checkData[`analysisError_${currentTabId}`];

              if (status === 'completed' && result) {
                console.log('[PropaScan] Analysis completed successfully');
                clearInterval(checkInterval);
                setLoading(false);
                resetScanButton();
                displayResults(result);
              } else if (status === 'error') {
                console.error('[PropaScan] Analysis failed:', error);
                clearInterval(checkInterval);
                setLoading(false);
                resetScanButton();
                showError(error || 'Analysis failed');
              }
            });
          }, 1000);

          // Stop polling after 2 minutes
          setTimeout(() => {
            clearInterval(checkInterval);
          }, 120000);
        });
      }
    } catch (error) {
      console.error('[PropaScan] Error scanning page:', error);
      setLoading(false);
      resetScanButton();
      showError('Error scanning page: ' + error.message);
    }
  }

  // Reset scan button to original state
  function resetScanButton() {
    if (scanPageBtn) {
      scanPageBtn.disabled = false;
      scanPageBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        Scan This Page
      `;
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Check Sentinel mode and load cached results
  async function checkSentinelMode() {
    try {
      const modeResult = await chrome.storage.sync.get(['detectionMode']);
      if (modeResult.detectionMode !== 'sentinel') {
        return false; // Not in Sentinel mode, let loadSavedResults handle it
      }

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        return false;
      }

      // Check if URL is valid
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return false;
      }

      // Check for cached result (returns Promise)
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'getCachedResult',
          url: tab.url
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Sentinel] Error getting cached result:', chrome.runtime.lastError);
            resolve(false);
            return;
          }

          if (response && response.success && response.cached) {
            // Show cached result
            const cached = response.cached;
            console.log('[Sentinel] Loading cached result for:', tab.url);
            
          // Calculate time since scan
          const minutesAgo = Math.floor((Date.now() - cached.timestamp) / 1000 / 60);
          
          // Get metadata from cached entry if available, otherwise use current tab
          let metadata = null;
          if (cached.metadata) {
            metadata = cached.metadata;
          } else {
            // Get from current tab
            metadata = {
              url: tab.url,
              title: tab.title || '',
              domain: new URL(tab.url).hostname.replace('www.', ''),
              timestamp: cached.timestamp
            };
          }
          
          // Display result with timestamp and correct metadata
          displaySentinelResult(cached.result, minutesAgo, tab.url, metadata);
          resolve(true); // Sentinel handled it
          } else {
            // Check if scan is in progress
            chrome.storage.local.get(['sentinelCurrentScan'], (data) => {
              if (data.sentinelCurrentScan) {
                // Scan in progress
                showSentinelScanningState();
                resolve(true); // Sentinel handled it (showing loading state)
              } else {
                // No cached result and no scan in progress
                resolve(false); // Let loadSavedResults handle it
              }
            });
          }
        });
      });
    } catch (error) {
      console.error('[Sentinel] Error checking mode:', error);
      return false;
    }
  }

  // Display Sentinel mode result
  async function displaySentinelResult(result, minutesAgo, url, metadata = null) {
    resultsSection.classList.remove('hidden');
    setLoading(false);

    // Get current tab ID if not already set
    if (!currentTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabId = tab?.id;
    }

    if (!currentTabId) {
      console.error('Could not get tab ID for displaying Sentinel result');
      return;
    }

    // If metadata provided, set it with tab-specific key for displayResults
    if (metadata) {
      chrome.storage.local.set({ [`scanMetadata_${currentTabId}`]: metadata });
    } else {
      // Try to get metadata from current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          const tabMetadata = {
            url: url || tabs[0].url,
            title: tabs[0].title || '',
            domain: new URL(tabs[0].url).hostname.replace('www.', ''),
            timestamp: Date.now()
          };
          chrome.storage.local.set({ [`scanMetadata_${currentTabId}`]: tabMetadata });
        }
      });
    }
    
    // Add timestamp info
    let html = `<div class="sentinel-info">`;
    html += `<p class="sentinel-timestamp">Last scanned: ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago</p>`;
    html += `<div class="sentinel-actions">`;
    html += `<button id="rescanBtn" class="action-button rescan-btn">Rescan</button>`;
    html += `<button id="whitelistBtn" class="action-button whitelist-btn">Add to Whitelist</button>`;
    html += `</div></div>`;

    // Small delay to ensure metadata is set before displayResults reads it
    setTimeout(() => {
      // Display the result
      displayResults(result).then(() => {
        // Prepend the Sentinel info
        const resultsContent = document.getElementById('resultsContent');
        if (resultsContent) {
          resultsContent.innerHTML = html + resultsContent.innerHTML;
          
          // Add event listeners after DOM update
          setTimeout(() => {
            const rescanBtn = document.getElementById('rescanBtn');
            const whitelistBtn = document.getElementById('whitelistBtn');
            
            if (rescanBtn) {
              rescanBtn.addEventListener('click', async () => {
                await handleRescan(url);
              });
            }
            
            if (whitelistBtn) {
              whitelistBtn.addEventListener('click', async () => {
                await handleAddToWhitelist(url);
              });
            }
          }, 100);
        }
      });
    }, 50);
  }

  // Show scanning state
  function showSentinelScanningState() {
    resultsSection.classList.remove('hidden');
    setLoading(true);
    updateLoadingMessage('Scanning page automatically...');
  }

  // Check Sentinel status (whitelisted/rate limited)
  async function checkSentinelStatus(url) {
    // This would require additional background communication
    // For now, just show normal UI
  }

  // Handle rescan
  async function handleRescan(url) {
    try {
      setLoading(true);
      hideError();
      resultsSection.classList.remove('hidden');
      updateLoadingMessage('Rescanning page...');

      chrome.runtime.sendMessage({
        action: 'rescanPage',
        url: url
      }, (response) => {
        if (chrome.runtime.lastError) {
          setLoading(false);
          showError('Failed to rescan: ' + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success && response.result) {
          setLoading(false);
          displaySentinelResult(response.result, 0, url);
        } else if (response && response.error) {
          setLoading(false);
          showError(response.error);
        } else {
          // Poll for result
          const checkInterval = setInterval(() => {
            chrome.runtime.sendMessage({
              action: 'getCachedResult',
              url: url
            }, (checkResponse) => {
              if (checkResponse && checkResponse.success && checkResponse.cached) {
                clearInterval(checkInterval);
                setLoading(false);
                const cached = checkResponse.cached;
                const metadata = cached.metadata || {
                  url: url,
                  title: '',
                  domain: new URL(url).hostname.replace('www.', ''),
                  timestamp: cached.timestamp
                };
                displaySentinelResult(cached.result, 0, url, metadata);
              }
            });
          }, 1000);

          setTimeout(() => clearInterval(checkInterval), 120000);
        }
      });
    } catch (error) {
      setLoading(false);
      showError('Error rescanning: ' + error.message);
    }
  }

  // Handle add to whitelist
  async function handleAddToWhitelist(url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      
      chrome.runtime.sendMessage({
        action: 'addToWhitelist',
        domain: domain
      }, (response) => {
        if (chrome.runtime.lastError) {
          showError('Failed to add to whitelist: ' + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          showError('Domain added to whitelist. This page will no longer be auto-scanned.');
          // Clear results since it's whitelisted now
          setTimeout(() => {
            clearResults();
          }, 2000);
        } else if (response && response.error) {
          showError(response.error);
        }
      });
    } catch (error) {
      showError('Error adding to whitelist: ' + error.message);
    }
  }

  // Check Sentinel mode first (takes priority)
  // If not in Sentinel mode or no cached result, then load saved results
  checkSentinelMode().then((sentinelHandled) => {
    // Only load old results if Sentinel mode didn't handle it
    if (!sentinelHandled) {
      loadSavedResults();
    }
  });
});
