// PropaScan Extension
console.log('PropaScan Extension loaded!');

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

  // Select area (screenshot) button handler
  selectAreaBtn.addEventListener('click', async () => {
    await handleSelectArea();
  });

  // Analyze button handler
  analyzeBtn.addEventListener('click', async () => {
    await handleAnalyze();
  });

  // Clear preview button handler
  clearPreviewBtn.addEventListener('click', () => {
    clearPreview();
  });

  // Clear all button handler
  clearAllBtn.addEventListener('click', () => {
    clearPreview();
    clearResults();
  });

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

    // Show loading state
    setLoading(true);
    hideError();
    resultsSection.classList.remove('hidden');

    // Save original content and mark analysis as in progress
    await chrome.storage.local.set({ 
      analysisStatus: 'in_progress',
      originalImage: imageDataUrl,
      originalText: '' // Empty since we're only using images now
    });

    try {
      // Call the API with image only (empty text since everything is vision-based)
      // Background worker will save results to storage automatically
      const result = await window.PropaScanAPI.analyzeContent('', imageDataUrl);
      
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
  function displayResults(result) {
    let html = '';

    // Overall summary
    html += '<div class="result-summary">';
    html += `<div class="summary-item"><strong>Contains Propaganda:</strong> ${result.contains_propaganda ? 'Yes' : 'No'}</div>`;
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
  }

  // Set loading state
  function setLoading(isLoading) {
    if (isLoading) {
      loadingIndicator.classList.remove('hidden');
      resultsContent.innerHTML = '';
    } else {
      loadingIndicator.classList.add('hidden');
    }
    analyzeBtn.disabled = isLoading;
  }

  // Show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    resultsContent.innerHTML = '';
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
  function clearSavedContent() {
    chrome.storage.local.remove(['selectedScreenshot', 'selectionType'], () => {
      console.log('Saved selection cleared');
    });
  }

  // Load saved results from storage and check for pending analysis
  function loadSavedResults() {
    chrome.storage.local.get(['analysisResult', 'analysisStatus', 'analysisError', 'originalImage', 'selectedScreenshot', 'selectionType'], (data) => {
      // Check if there's a new screenshot from content script
      if (data.selectedScreenshot && data.selectionType === 'screenshot') {
        // Clear the selection flag and set the image
        chrome.storage.local.remove(['selectedScreenshot', 'selectionType']);
        imagePreview.src = data.selectedScreenshot;
        previewSection.classList.remove('hidden');
        // Scroll to preview section
        setTimeout(() => {
          previewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      
      // Restore original image if it exists (for persistent results)
      if (data.originalImage && !data.selectedScreenshot) {
        imagePreview.src = data.originalImage;
        previewSection.classList.remove('hidden');
      }
      
      if (data.analysisStatus === 'in_progress') {
        // Analysis is still running in background
        console.log('Analysis in progress, showing loading state');
        resultsSection.classList.remove('hidden');
        setLoading(true);
        
        // Poll for results (check every second)
        const checkInterval = setInterval(() => {
          chrome.storage.local.get(['analysisResult', 'analysisStatus', 'analysisError'], (checkData) => {
            if (checkData.analysisStatus === 'completed' && checkData.analysisResult) {
              clearInterval(checkInterval);
              setLoading(false);
              displayResults(checkData.analysisResult);
            } else if (checkData.analysisStatus === 'error') {
              clearInterval(checkInterval);
              setLoading(false);
              showError(checkData.analysisError || 'Analysis failed');
            }
          });
        }, 1000);
        
        // Stop polling after 2 minutes (timeout)
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 120000);
        
      } else if (data.analysisResult && data.analysisStatus === 'completed') {
        // Results are ready
        console.log('Loading saved analysis results');
        resultsSection.classList.remove('hidden');
        displayResults(data.analysisResult);
      } else if (data.analysisStatus === 'error') {
        // Show error if it exists
        resultsSection.classList.remove('hidden');
        showError(data.analysisError || 'Analysis failed');
      }
    });
  }

  // Clear saved results from storage
  function clearSavedResults() {
    chrome.storage.local.remove(['analysisResult', 'analysisStatus', 'analysisError', 'originalImage'], () => {
      console.log('Saved analysis results, status, and original content cleared');
    });
  }

  // Clear results
  function clearResults() {
    resultsSection.classList.add('hidden');
    resultsContent.innerHTML = '';
    hideError();
    setLoading(false);
    clearSavedResults();
  }

  // Load saved results when popup opens
  loadSavedResults();
});
