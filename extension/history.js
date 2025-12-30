// History page logic for PropaScan Extension

let allHistory = [];
let filteredHistory = [];

// Load history from storage
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['analysisHistory']);
    allHistory = result.analysisHistory || [];
    allHistory.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
    applyFilters();
  } catch (error) {
    console.error('Error loading history:', error);
    showEmptyState();
  }
}

// Apply filters
function applyFilters() {
  const severityFilter = document.getElementById('filterSeverity').value;
  const tierFilter = document.getElementById('filterTier').value;

  filteredHistory = allHistory.filter(entry => {
    if (severityFilter !== 'all' && entry.severity !== severityFilter) {
      return false;
    }
    if (tierFilter !== 'all' && entry.tier.toString() !== tierFilter) {
      return false;
    }
    return true;
  });

  updateStats();
  renderHistory();
}

// Update statistics
function updateStats() {
  document.getElementById('totalCount').textContent = allHistory.length;
  document.getElementById('showingCount').textContent = filteredHistory.length;
}

// Render history list
function renderHistory() {
  const historyList = document.getElementById('historyList');
  const emptyState = document.getElementById('emptyState');

  if (filteredHistory.length === 0) {
    historyList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  historyList.innerHTML = '';

  filteredHistory.forEach(entry => {
    const item = createHistoryItem(entry);
    historyList.appendChild(item);
  });
}

// Create history item element
function createHistoryItem(entry) {
  const item = document.createElement('div');
  item.className = 'history-item';
  item.dataset.id = entry.id;

  const timestamp = new Date(entry.timestamp);
  const timeAgo = getTimeAgo(entry.timestamp);
  const score = entry.score || 0;
  const scoreClass = getScoreClass(score);

  item.innerHTML = `
    <div class="history-item-header">
      <div style="flex: 1;">
        <div class="history-item-title">${escapeHtml(entry.title || entry.domain || 'Unknown')}</div>
        <div class="history-item-url">${escapeHtml(entry.url)}</div>
      </div>
      <div class="score-display ${scoreClass}">${score}</div>
    </div>
    <div class="history-item-meta">
      <span class="meta-badge tier-badge">Tier ${entry.tier}</span>
      <span class="meta-badge severity-badge ${entry.severity || 'none'}">${(entry.severity || 'none').toUpperCase()}</span>
      ${entry.contains_propaganda ? '<span class="meta-badge" style="background: rgba(220, 53, 69, 0.2); border: 1px solid rgba(220, 53, 69, 0.4); color: #dc3545;">Propaganda Detected</span>' : ''}
    </div>
    <div class="history-item-timestamp">${timestamp.toLocaleString()} (${timeAgo})</div>
    <div class="history-item-actions">
      <button class="item-action-btn view-details-btn">View Details</button>
      <button class="item-action-btn open-url-btn">Open URL</button>
      <button class="item-action-btn delete-btn">Delete</button>
    </div>
    <div class="history-item-details">
      ${renderDetails(entry)}
    </div>
  `;

  // Add event listeners
  const viewDetailsBtn = item.querySelector('.view-details-btn');
  const openUrlBtn = item.querySelector('.open-url-btn');
  const deleteBtn = item.querySelector('.delete-btn');

  viewDetailsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    item.classList.toggle('expanded');
    viewDetailsBtn.textContent = item.classList.contains('expanded') ? 'Hide Details' : 'View Details';
  });

  openUrlBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.tabs.create({ url: entry.url });
  });

  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (confirm('Delete this analysis from history?')) {
      await deleteHistoryEntry(entry.id);
    }
  });

  return item;
}

// Render details section
function renderDetails(entry) {
  const result = entry.result || {};
  const analysis = result.analysis || {};
  const textAnalysis = analysis.text_analysis || {};
  const visualAnalysis = analysis.visual_analysis || {};

  let html = '';

  if (result.tier_justification) {
    html += `
      <div class="details-section">
        <h4>Tier Justification</h4>
        <p>${escapeHtml(result.tier_justification)}</p>
      </div>
    `;
  }

  if (textAnalysis.tone || textAnalysis.framing) {
    html += `
      <div class="details-section">
        <h4>Text Analysis</h4>
        ${textAnalysis.tone ? `<p><strong>Tone:</strong> ${escapeHtml(textAnalysis.tone)}</p>` : ''}
        ${textAnalysis.framing ? `<p><strong>Framing:</strong> ${escapeHtml(textAnalysis.framing)}</p>` : ''}
        ${textAnalysis.missing_context ? `<p><strong>Missing Context:</strong> ${escapeHtml(textAnalysis.missing_context)}</p>` : ''}
        ${textAnalysis.factual_accuracy ? `<p><strong>Factual Accuracy:</strong> ${escapeHtml(textAnalysis.factual_accuracy)}</p>` : ''}
      </div>
    `;
  }

  if (visualAnalysis.psychological_intent || visualAnalysis.composition) {
    html += `
      <div class="details-section">
        <h4>Visual Analysis</h4>
        ${visualAnalysis.psychological_intent ? `<p><strong>Psychological Intent:</strong> ${escapeHtml(visualAnalysis.psychological_intent)}</p>` : ''}
        ${visualAnalysis.composition ? `<p><strong>Composition:</strong> ${escapeHtml(visualAnalysis.composition)}</p>` : ''}
        ${visualAnalysis.dominant_colors && visualAnalysis.dominant_colors.length > 0 ? `<p><strong>Dominant Colors:</strong> ${visualAnalysis.dominant_colors.join(', ')}</p>` : ''}
      </div>
    `;
  }

  if (result.instances && result.instances.length > 0) {
    html += `
      <div class="details-section">
        <h4>Detected Techniques (${result.instances.length})</h4>
        <ul>
          ${result.instances.map(instance => `
            <li><strong>${escapeHtml(instance.technique)}</strong> (${instance.severity_weight || 'unknown'} severity, ${instance.confidence || 'unknown'} confidence): ${escapeHtml(instance.explanation || '')}</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  if (result.credibility_red_flags && result.credibility_red_flags.length > 0) {
    html += `
      <div class="details-section">
        <h4>Credibility Red Flags</h4>
        <ul>
          ${result.credibility_red_flags.map(flag => `<li>${escapeHtml(flag)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (result.target_audience) {
    html += `
      <div class="details-section">
        <h4>Target Audience</h4>
        <p>${escapeHtml(result.target_audience)}</p>
      </div>
    `;
  }

  if (result.intended_effect) {
    html += `
      <div class="details-section">
        <h4>Intended Effect</h4>
        <p>${escapeHtml(result.intended_effect)}</p>
      </div>
    `;
  }

  return html || '<p style="color: rgba(255,255,255,0.5);">No additional details available.</p>';
}

// Get time ago string
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

// Get score class for styling
function getScoreClass(score) {
  if (score >= 0 && score <= 25) return 'low';
  if (score >= 26 && score <= 50) return 'medium';
  if (score >= 51 && score <= 75) return 'high';
  return 'very-high';
}

// Delete history entry
async function deleteHistoryEntry(id) {
  try {
    allHistory = allHistory.filter(entry => entry.id !== id);
    await chrome.storage.local.set({ analysisHistory: allHistory });
    applyFilters();
  } catch (error) {
    console.error('Error deleting entry:', error);
    alert('Failed to delete entry. Please try again.');
  }
}

// Clear all history
async function clearAllHistory() {
  if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) {
    return;
  }

  try {
    await chrome.storage.local.set({ analysisHistory: [] });
    allHistory = [];
    applyFilters();
  } catch (error) {
    console.error('Error clearing history:', error);
    alert('Failed to clear history. Please try again.');
  }
}

// Show empty state
function showEmptyState() {
  document.getElementById('historyList').innerHTML = '';
  document.getElementById('emptyState').classList.remove('hidden');
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Navigate back
function goBack() {
  window.close();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();

  // Filter change handlers
  document.getElementById('filterSeverity').addEventListener('change', applyFilters);
  document.getElementById('filterTier').addEventListener('change', applyFilters);

  // Button handlers
  document.getElementById('clearHistoryBtn').addEventListener('click', clearAllHistory);
  document.getElementById('backBtn').addEventListener('click', goBack);
});

