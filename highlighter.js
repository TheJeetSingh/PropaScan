// Page Highlighter for PropaScan Extension
// Highlights detected propaganda instances on the page

// Prevent multiple injections - check if already loaded
if (window.propascanHighlighterLoaded) {
  console.log('[Highlighter] Script already loaded, skipping re-injection');
} else {
  window.propascanHighlighterLoaded = true;

// Wrap in IIFE to prevent variable conflicts
(function() {
  'use strict';

let highlightsActive = false;
let highlightedElements = [];
let dismissedInstances = new Set();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Highlighter] Received message:', request.action);
  
  if (request.action === 'ping') {
    // Respond to ping to indicate script is loaded
    sendResponse({ success: true, loaded: true });
    return true;
  } else if (request.action === 'showHighlights') {
    console.log('[Highlighter] showHighlights action received with', request.instances?.length || 0, 'instances');
    showHighlights(request.instances);
    sendResponse({ success: true });
  } else if (request.action === 'hideHighlights') {
    hideHighlights();
    sendResponse({ success: true });
  } else if (request.action === 'clearHighlights') {
    clearHighlights();
    sendResponse({ success: true });
  }
  return true;
});

// Show highlights on page
function showHighlights(instances) {
  if (highlightsActive) {
    clearHighlights();
  }

  if (!instances || instances.length === 0) {
    console.log('[Highlighter] No instances to highlight');
    return;
  }

  console.log(`[Highlighter] Received ${instances.length} instances to highlight`);
  console.log('[Highlighter] Instance types:', instances.map(inst => ({
    type: inst.element_type,
    hasElement: !!inst.element,
    elementPreview: inst.element ? inst.element.substring(0, 50) : 'none'
  })));

  highlightsActive = true;
  highlightedElements = [];
  dismissedInstances.clear();

  // Filter out dismissed instances
  const activeInstances = instances.filter(inst => !dismissedInstances.has(inst.element));

  console.log(`[Highlighter] Processing ${activeInstances.length} active instances (after filtering dismissed)`);

  // Process text instances
  let textCount = 0;
  let visualCount = 0;
  activeInstances.forEach((instance, index) => {
    if (instance.element_type === 'text' && instance.element) {
      textCount++;
      highlightText(instance, index);
    } else if (instance.element_type === 'visual' && instance.element) {
      visualCount++;
      highlightImage(instance, index);
    } else {
      console.warn(`[Highlighter] Skipping instance ${index}: missing element_type or element`, instance);
    }
  });

  console.log(`[Highlighter] Processed ${textCount} text instances and ${visualCount} visual instances`);

  // Add "Hide All" button
  addHideAllButton();

  console.log(`[Highlighter] Successfully highlighted ${highlightedElements.length} elements on page`);
  
  if (highlightedElements.length === 0) {
    console.warn('[Highlighter] WARNING: No elements were highlighted! This might mean:');
    console.warn('[Highlighter] 1. Text matching failed (text not found in DOM)');
    console.warn('[Highlighter] 2. Instances have empty or invalid element fields');
    console.warn('[Highlighter] 3. Text is split across multiple nodes in a way we can\'t detect');
  }
}

// Highlight text on page
function highlightText(instance, index) {
  const searchText = instance.element.trim();
  if (!searchText || searchText.length < 5) {
    console.log('[Highlighter] Text too short, skipping:', searchText);
    return;
  }

  console.log(`[Highlighter] Searching for text: "${searchText.substring(0, 50)}..."`);

  // Normalize search text (collapse whitespace, remove punctuation for matching, lowercase)
  const normalizedSearch = searchText
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .trim();

  // Get all text content from body
  const bodyText = document.body.innerText || document.body.textContent || '';
  const normalizedBodyText = bodyText
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .toLowerCase();

  // Check if text exists in page at all
  if (!normalizedBodyText.includes(normalizedSearch)) {
    console.log('[Highlighter] Text not found in page body, trying fuzzy match...');
    
    // Try fuzzy match with first 15 characters
    const fuzzySearch = normalizedSearch.substring(0, Math.min(15, normalizedSearch.length));
    if (!normalizedBodyText.includes(fuzzySearch)) {
      console.log('[Highlighter] Fuzzy match also failed, skipping instance');
      return;
    }
  }

  // Try to find text in DOM using multiple strategies
  const matches = [];

  // Strategy 1: Direct text node matching
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script and style tags
        const parent = node.parentNode;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );

  let node;
  let nodeIndex = 0;

  while (node = walker.nextNode()) {
    const nodeText = node.textContent || '';
    if (!nodeText.trim()) continue;

    // Normalize node text for comparison
    const normalizedNode = nodeText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .toLowerCase();

    // Check for exact match
    const matchIndex = normalizedNode.indexOf(normalizedSearch);
    if (matchIndex !== -1) {
      // Find the actual position in original text (accounting for removed punctuation)
      let actualStart = 0;
      let charCount = 0;
      for (let i = 0; i < nodeText.length; i++) {
        const char = nodeText[i];
        if (/\s/.test(char)) {
          if (charCount > 0) charCount++;
        } else if (/[\w]/.test(char)) {
          charCount++;
        }
        if (charCount === matchIndex + 1) {
          actualStart = i + 1;
          break;
        }
      }
      
      // Try to find actual substring in original text
      const originalSearch = searchText.replace(/\s+/g, ' ').trim();
      const actualMatchIndex = nodeText.toLowerCase().indexOf(originalSearch.toLowerCase());
      
      if (actualMatchIndex !== -1) {
        matches.push({
          node: node,
          start: actualMatchIndex,
          end: actualMatchIndex + originalSearch.length,
          text: originalSearch
        });
        console.log(`[Highlighter] Found exact match in node ${nodeIndex}`);
      }
    } else {
      // Strategy 2: Try fuzzy match (first 20 chars)
      const fuzzyMatch = normalizedSearch.substring(0, Math.min(20, normalizedSearch.length));
      const fuzzyIndex = normalizedNode.indexOf(fuzzyMatch);
      if (fuzzyIndex !== -1) {
        // Try to find similar text in original
        const originalFuzzy = searchText.substring(0, Math.min(30, searchText.length)).trim();
        const originalFuzzyIndex = nodeText.toLowerCase().indexOf(originalFuzzy.toLowerCase());
        if (originalFuzzyIndex !== -1) {
          matches.push({
            node: node,
            start: originalFuzzyIndex,
            end: Math.min(originalFuzzyIndex + originalFuzzy.length, nodeText.length),
            text: nodeText.substring(originalFuzzyIndex, Math.min(originalFuzzyIndex + originalFuzzy.length, nodeText.length))
          });
          console.log(`[Highlighter] Found fuzzy match in node ${nodeIndex}`);
        }
      }
    }
    nodeIndex++;
  }

  // Strategy 3: If no matches found, try searching in parent elements
  if (matches.length === 0) {
    console.log('[Highlighter] No direct matches, trying parent element search...');
    const allElements = document.querySelectorAll('p, div, span, article, section, h1, h2, h3, h4, h5, h6, li, td, th');
    
    allElements.forEach((el, elIndex) => {
      const elText = el.innerText || el.textContent || '';
      if (!elText.trim()) return;

      const normalizedElText = elText
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .toLowerCase();

      if (normalizedElText.includes(normalizedSearch)) {
        // Find text nodes within this element
        const elWalker = document.createTreeWalker(
          el,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let elNode;
        while (elNode = elWalker.nextNode()) {
          const elNodeText = elNode.textContent || '';
          const originalSearch = searchText.replace(/\s+/g, ' ').trim();
          const elMatchIndex = elNodeText.toLowerCase().indexOf(originalSearch.toLowerCase());
          
          if (elMatchIndex !== -1) {
            matches.push({
              node: elNode,
              start: elMatchIndex,
              end: elMatchIndex + originalSearch.length,
              text: originalSearch
            });
            console.log(`[Highlighter] Found match in element ${elIndex} (${el.tagName})`);
            break; // Only take first match per element
          }
        }
      }
    });
  }

  console.log(`[Highlighter] Found ${matches.length} matches for instance ${index}`);

  // Highlight all matches
  matches.forEach((match, matchIndex) => {
    try {
      const highlight = createTextHighlight(match.node, match.start, match.end, instance, index);
      if (highlight) {
        highlightedElements.push(highlight);
        console.log(`[Highlighter] Successfully highlighted match ${matchIndex + 1}`);
      }
    } catch (error) {
      console.error('[Highlighter] Error highlighting text:', error, match);
    }
  });

  if (matches.length === 0) {
    console.warn(`[Highlighter] Could not find text "${searchText.substring(0, 50)}..." in DOM`);
  }
}

// Create text highlight element
function createTextHighlight(textNode, start, end, instance, index) {
  try {
    const parent = textNode.parentNode;
    if (!parent) return null;

    const nodeText = textNode.textContent;
    const beforeText = nodeText.substring(0, start);
    const highlightText = nodeText.substring(start, end);
    const afterText = nodeText.substring(end);

    // Create wrapper
    const wrapper = document.createElement('span');
    wrapper.className = 'propascan-highlight-wrapper';

    // Create highlight element
    const highlight = document.createElement('mark');
    highlight.className = `propascan-highlight propascan-severity-${instance.severity_weight || 'low'}`;
    highlight.dataset.instanceIndex = index;
    // Use first 50 chars as ID, or hash if element is too long
    const instanceId = instance.element ? (instance.element.length > 50 ? instance.element.substring(0, 50) : instance.element) : `instance-${index}`;
    highlight.dataset.instanceId = instanceId;
    highlight.textContent = highlightText;

    // Store instance data
    highlight.dataset.technique = instance.technique || 'Unknown';
    highlight.dataset.explanation = instance.explanation || '';
    highlight.dataset.severity = instance.severity_weight || 'low';
    highlight.dataset.element = instance.element || '';

    // Add tooltip on hover
    setupTooltip(highlight, instance);

    // Build wrapper content
    if (beforeText) {
      wrapper.appendChild(document.createTextNode(beforeText));
    }
    wrapper.appendChild(highlight);
    if (afterText) {
      wrapper.appendChild(document.createTextNode(afterText));
    }

    // Replace text node with wrapper
    parent.replaceChild(wrapper, textNode);

    return highlight;
  } catch (error) {
    console.error('[Highlighter] Error creating text highlight:', error);
    return null;
  }
}

// Highlight images (simplified - will highlight all images if visual instance)
function highlightImage(instance, index) {
  // For now, we'll skip image highlighting as it requires image-to-description mapping
  // This can be enhanced later with image URL matching
  console.log('[Highlighter] Image highlighting not yet implemented');
}

// Setup tooltip for highlight
function setupTooltip(highlightElement, instance) {
  let tooltip = null;
  let hoverTimeout = null;
  let leaveTimeout = null;

  highlightElement.addEventListener('mouseenter', () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    
    hoverTimeout = setTimeout(() => {
      // Remove existing tooltip if any
      const existing = document.querySelector('.propascan-tooltip');
      if (existing) {
        existing.remove();
      }
      
      tooltip = createTooltip(instance, highlightElement);
      document.body.appendChild(tooltip);
      positionTooltip(tooltip, highlightElement);
      tooltip.classList.add('visible');
      
      // Add mouseenter/mouseleave handlers to tooltip
      tooltip.addEventListener('mouseenter', () => {
        if (leaveTimeout) clearTimeout(leaveTimeout);
      });
      
      tooltip.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
        setTimeout(() => {
          if (tooltip && !tooltip.classList.contains('visible')) {
            tooltip.remove();
            tooltip = null;
          }
        }, 200);
      });
    }, 300);
  });

  highlightElement.addEventListener('mouseleave', () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    
    leaveTimeout = setTimeout(() => {
      if (tooltip && !tooltip.matches(':hover')) {
        tooltip.classList.remove('visible');
        // Remove after animation
        setTimeout(() => {
          if (tooltip && !tooltip.classList.contains('visible')) {
            tooltip.remove();
            tooltip = null;
          }
        }, 200);
      }
    }, 200);
  });
}

// Create tooltip element
function createTooltip(instance, highlightElement) {
  const tooltip = document.createElement('div');
  tooltip.className = 'propascan-tooltip';
  tooltip.dataset.severity = instance.severity_weight || 'low';

  const technique = instance.technique || 'Unknown Technique';
  const severity = (instance.severity_weight || 'low').toUpperCase();
  const explanation = instance.explanation || 'No explanation available';
  const element = instance.element || '';
  const instanceId = highlightElement ? highlightElement.dataset.instanceId : (element.length > 50 ? element.substring(0, 50) : element);

  tooltip.innerHTML = `
    <div class="propascan-tooltip-header">
      <span class="propascan-tooltip-technique">${escapeHtml(technique)}</span>
      <span class="propascan-tooltip-severity severity-${instance.severity_weight || 'low'}">${severity}</span>
    </div>
    <div class="propascan-tooltip-content">
      <div class="propascan-tooltip-quote">${escapeHtml(element.length > 150 ? element.substring(0, 150) + '...' : element)}</div>
      <div class="propascan-tooltip-explanation">${escapeHtml(explanation)}</div>
    </div>
    <div class="propascan-tooltip-footer">
      <button class="propascan-tooltip-dismiss" data-instance-id="${escapeHtml(instanceId)}">Dismiss</button>
    </div>
  `;

  // Add dismiss handler
  const dismissBtn = tooltip.querySelector('.propascan-tooltip-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = dismissBtn.dataset.instanceId;
      dismissInstance(id);
      if (tooltip) {
        tooltip.remove();
      }
    });
  }

  // Add mouseenter/mouseleave handlers
  tooltip.addEventListener('mouseenter', () => {
    // Keep visible
  });
  
  tooltip.addEventListener('mouseleave', () => {
    tooltip.classList.remove('visible');
    setTimeout(() => {
      if (tooltip && !tooltip.classList.contains('visible')) {
        tooltip.remove();
      }
    }, 200);
  });

  return tooltip;
}

// Position tooltip relative to highlight
function positionTooltip(tooltip, highlightElement) {
  const rect = highlightElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Try to position above first
  let top = rect.top - tooltipRect.height - 10;
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

  // If not enough space above, position below
  if (top < 10) {
    top = rect.bottom + 10;
  }

  // Keep within viewport
  if (left < 10) {
    left = 10;
  } else if (left + tooltipRect.width > viewportWidth - 10) {
    left = viewportWidth - tooltipRect.width - 10;
  }

  tooltip.style.top = `${top + window.scrollY}px`;
  tooltip.style.left = `${left + window.scrollX}px`;
}

// Dismiss a specific instance
function dismissInstance(instanceId) {
  dismissedInstances.add(instanceId);
  
  // Remove all highlights with this instance ID
  highlightedElements.forEach(el => {
    if (el.dataset.instanceId === instanceId) {
      const wrapper = el.closest('.propascan-highlight-wrapper');
      if (wrapper && wrapper.parentNode) {
        // Restore original text
        const text = wrapper.textContent;
        wrapper.parentNode.replaceChild(document.createTextNode(text), wrapper);
      }
    }
  });

  // Remove from highlighted elements
  highlightedElements = highlightedElements.filter(el => el.dataset.instanceId !== instanceId);

  // Update tooltips
  document.querySelectorAll('.propascan-tooltip').forEach(tooltip => {
    if (tooltip.querySelector(`[data-instance-id="${instanceId}"]`)) {
      tooltip.remove();
    }
  });
}

// Hide all highlights
function hideHighlights() {
  if (!highlightsActive) return;

  // Hide all highlight elements
  highlightedElements.forEach(el => {
    el.style.display = 'none';
  });

  // Hide all tooltips
  document.querySelectorAll('.propascan-tooltip').forEach(tooltip => {
    tooltip.classList.remove('visible');
  });

  // Hide "Hide All" button
  const hideAllBtn = document.getElementById('propascan-hide-all-btn');
  if (hideAllBtn) {
    hideAllBtn.style.display = 'none';
  }
}

// Clear all highlights
function clearHighlights() {
  if (!highlightsActive) return;

  // Remove all highlight wrappers and restore original text
  highlightedElements.forEach(el => {
    const wrapper = el.closest('.propascan-highlight-wrapper');
    if (wrapper && wrapper.parentNode) {
      const text = wrapper.textContent;
      wrapper.parentNode.replaceChild(document.createTextNode(text), wrapper);
    }
  });

  // Remove all tooltips
  document.querySelectorAll('.propascan-tooltip').forEach(tooltip => {
    tooltip.remove();
  });

  // Remove "Hide All" button
  const hideAllBtn = document.getElementById('propascan-hide-all-btn');
  if (hideAllBtn) {
    hideAllBtn.remove();
  }

  highlightsActive = false;
  highlightedElements = [];
  dismissedInstances.clear();

  console.log('[Highlighter] Cleared all highlights');
}

// Add "Hide All" floating button
function addHideAllButton() {
  // Remove existing button if any
  const existing = document.getElementById('propascan-hide-all-btn');
  if (existing) {
    existing.remove();
  }

  const button = document.createElement('button');
  button.id = 'propascan-hide-all-btn';
  button.className = 'propascan-hide-all-btn';
  button.textContent = 'Hide All Highlights';
  button.title = 'Hide all propaganda highlights on this page';

  button.addEventListener('click', () => {
    clearHighlights();
    // Notify background that highlights were cleared
    chrome.runtime.sendMessage({ action: 'highlightsCleared' });
  });

  document.body.appendChild(button);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  clearHighlights();
});

// Handle dynamic content (observe DOM changes)
const observer = new MutationObserver((mutations) => {
  // If highlights are active and DOM changes significantly, we might need to re-highlight
  // For now, just log - can be enhanced later
  if (highlightsActive && highlightedElements.length > 0) {
    // Check if any highlighted elements were removed
    const stillExists = highlightedElements.filter(el => {
      return document.contains(el) || document.contains(el.closest('.propascan-highlight-wrapper'));
    });
    
    if (stillExists.length < highlightedElements.length) {
      console.log('[Highlighter] Some highlights were removed by DOM changes');
      highlightedElements = stillExists;
    }
  }
});

// Start observing after a short delay
setTimeout(() => {
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}, 1000);

})(); // End IIFE
} // End check for already loaded

