// PropaScan Extension
console.log('PropaScan Extension loaded!');

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM loaded');

  // Get DOM elements
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const clearImageBtn = document.getElementById('clearImageBtn');
  const textInput = document.getElementById('textInput');
  const charCount = document.getElementById('charCount');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');

  // Maximum file size (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Image upload handler
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, GIF, etc.)');
      imageInput.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size exceeds 10MB limit. Please choose a smaller image.\nYour file: ${formatFileSize(file.size)}`);
      imageInput.value = '';
      return;
    }

    // Read and display the image
    const reader = new FileReader();

    reader.onload = (event) => {
      imagePreview.src = event.target.result;
      fileName.textContent = file.name;
      fileSize.textContent = formatFileSize(file.size);

      // Show preview and clear button
      imagePreviewContainer.classList.remove('hidden');
      clearImageBtn.classList.remove('hidden');
    };

    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      imageInput.value = '';
    };

    reader.readAsDataURL(file);
  });

  // Clear image handler
  clearImageBtn.addEventListener('click', () => {
    clearImage();
  });

  // Text input handler with character count
  textInput.addEventListener('input', () => {
    updateCharCount();
  });

  // Analyze button handler
  analyzeBtn.addEventListener('click', async () => {
    await handleAnalyze();
  });

  // Clear all button handler
  clearAllBtn.addEventListener('click', () => {
    clearImage();
    clearText();
    clearResults();
  });

  // Helper function to clear image
  function clearImage() {
    imageInput.value = '';
    imagePreview.src = '';
    fileName.textContent = '';
    fileSize.textContent = '';
    imagePreviewContainer.classList.add('hidden');
    clearImageBtn.classList.add('hidden');
  }

  // Helper function to clear text
  function clearText() {
    textInput.value = '';
    updateCharCount();
  }

  // Helper function to update character count
  function updateCharCount() {
    const count = textInput.value.length;
    charCount.textContent = `${count.toLocaleString()} character${count !== 1 ? 's' : ''}`;
  }

  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Handle analyze action
  async function handleAnalyze() {
    const textContent = textInput.value.trim();
    const imageDataUrl = imagePreview.src;
    const hasValidImage = imageDataUrl && imageDataUrl.startsWith('data:image');

    // Validate that at least one input is provided
    if (!textContent && !hasValidImage) {
      showError('Please provide text or upload an image to analyze.');
      return;
    }

    // Show loading state
    setLoading(true);
    hideError();
    resultsSection.classList.remove('hidden');

    try {
      // Get image data URL if image is present and valid
      const imageData = hasValidImage ? imageDataUrl : '';

      // Call the API
      const result = await window.PropaScanAPI.analyzeContent(textContent, imageData);
      
      // Display results
      displayResults(result);
    } catch (error) {
      console.error('Analysis error:', error);
      showError(`Analysis failed: ${error.message}`);
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
      html += '<h3>Impact Analysis</h3>';
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

  // Clear results
  function clearResults() {
    resultsSection.classList.add('hidden');
    resultsContent.innerHTML = '';
    hideError();
  }

  // Initialize character count
  updateCharCount();
});

