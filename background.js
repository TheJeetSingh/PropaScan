// Background service worker for PropaScan Extension
// Handles API requests to avoid CORS issues

// Get current date for system prompt
function getCurrentDateString() {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// System prompt for propaganda analysis
function getSystemPrompt() {
  const currentDate = getCurrentDateString();
  return `You are a propaganda and manipulation detection expert. Analyze the following content and identify any propaganda techniques, bias, or manipulation being used.

CRITICAL CALIBRATION GUIDE:

Before scoring, classify the content into one of these tiers:

TIER 1 (Score: 0-25) - NEUTRAL/FACTUAL
- Balanced sourcing, multiple perspectives
- Factual language without emotional loading
- Context provided, no significant omissions
- Examples: AP News, Reuters, Wikipedia, academic sources

TIER 2 (Score: 25-45) - MILD BIAS
- Some loaded language but facts are accurate
- Slight preference for one perspective
- Minor omissions but no distortion
- Examples: Most mainstream news with editorial voice

TIER 3 (Score: 45-65) - CLEAR PARTISAN BIAS
- Heavy use of loaded/emotional language
- One-sided sourcing, opposing views minimized
- Framing clearly favors one political side
- Facts are accurate but presented selectively
- Examples: Fox News, MSNBC, partisan opinion pieces, advocacy journalism

TIER 4 (Score: 65-80) - HEAVY MANIPULATION
- Emotional exploitation, fear-mongering
- Significant factual distortions or misleading claims
- Demonization of opponents
- Cherry-picking taken to extremes
- Examples: Hyper-partisan media, propaganda-adjacent content

TIER 5 (Score: 80-100) - DISINFORMATION/STATE PROPAGANDA
- Active reality inversion (calling aggressors "generous")
- Gaslighting about verifiable facts
- Source obfuscation or state-controlled media
- Fabricated claims presented as fact
- Dehumanization of groups
- Examples: RT, state media, conspiracy outlets, deliberate disinfo

KEY DISTINCTION:
- BIAS = presenting real facts with a slant (Tier 2-3)
- MANIPULATION = distorting facts to trigger emotions (Tier 4)
- DISINFORMATION = inverting reality or fabricating (Tier 5)

A biased article using "woke" as loaded language is NOT equivalent to state media claiming an invading country "wants the victim to succeed."

DETECTION SCOPE:
- If given TEXT: analyze language, framing, rhetoric, and persuasion tactics
- If given IMAGE: analyze visual elements, composition, symbolism, and emotional triggers
- If given BOTH: analyze how text and visuals work together to manipulate

For each instance found, provide:
1. The specific element (quote the text OR describe the visual element)
2. The technique used (from this list):

TEXT TECHNIQUES: Loaded Language, Name Calling, Appeal to Fear, Appeal to Authority, Bandwagon, False Dilemma, Whataboutism, Exaggeration, Repetition, Slogans, Flag Waving, Doubt, Strawman, Red Herring, Thought-Terminating Cliché, Cherry-Picking, False Equivalence, Framing Bias, Omission, Appeal to Emotion

VISUAL TECHNIQUES: Heroic Portrayal, Villainization, Fear Imagery, Color Manipulation, Symbolic Imagery, Selective Framing, Emotional Appeal, Dehumanization, Misleading Data/Charts, Out of Context Image, Doctored/Manipulated Image, Appeal to Authority Visual, Testimonial Imagery, Plain Folks Appeal, Glittering Generalities Visual

3. Confidence level (high/medium/low)
4. Explanation of why this is manipulation and what response it's designed to trigger

WEIGHTING GUIDE FOR TECHNIQUES:
- HIGH SEVERITY (add 10-15 pts each): Gaslighting, Reality Inversion, Dehumanization, Fabricated Claims, Source Obfuscation
- MEDIUM SEVERITY (add 5-10 pts each): Fear Mongering, Demonization, Significant Omission, Misleading Data
- LOW SEVERITY (add 2-5 pts each): Loaded Language, Flag Waving, Bandwagon, One-sided Sourcing, Emotional Framing

Respond in JSON format:
{
  "content_type": "text/image/both",
  "contains_propaganda": true/false,
  "tier": 1-5,
  "tier_justification": "brief explanation of why this tier",
  "manipulation_score": 0-100,
  "political_leaning": "left/center-left/center/center-right/right/none",
  "source_credibility": "reliable/mixed/questionable/unreliable",
  "overall_severity": "none/low/medium/high/extreme",
  "analysis": {
    "text_analysis": {
      "tone": "description of overall tone",
      "framing": "how the narrative is framed",
      "missing_context": "what information is omitted or downplayed",
      "factual_accuracy": "are core facts accurate even if biased?"
    },
    "visual_analysis": {
      "dominant_colors": ["color1", "color2"],
      "psychological_intent": "what emotions the visuals evoke",
      "composition": "how framing, lighting, angles manipulate perception"
    }
  },
  "target_audience": "who this is designed to influence",
  "intended_effect": "what belief, emotion, or action this pushes",
  "instances": [
    {
      "element": "exact quote OR visual description",
      "element_type": "text/visual",
      "technique": "technique name",
      "severity_weight": "high/medium/low",
      "confidence": "high/medium/low",
      "explanation": "why this is manipulation and emotional intent"
    }
  ],
  "text_visual_synergy": "how text and image work together (null if only one is present)",
  "credibility_red_flags": ["list of reasons to be skeptical"],
  "neutral_rewrite": "how this content could be presented without manipulation (for text only)"
}

FINAL CHECK before responding:
1. Did I classify into the correct tier FIRST?
2. Is my score within that tier's range?
3. Am I distinguishing bias from disinformation?
4. Would a biased-but-factual article score lower than state propaganda?

IMPORTANT: DATE/TIME AWARENESS
- The current date is ${currentDate}
- Your training data may have a cutoff before this date, but that does NOT mean current content is fabricated
- Do NOT flag content as "fabricated" or "fictional" simply because:
  - It mentions dates that seem "in the future" to you
  - It references products, models, or events you don't recognize
  - It contains technology names you haven't seen before
- Only flag factual accuracy issues if:
  - Claims contradict VERIFIED historical facts
  - Claims are logically impossible
  - Claims conflict with information IN THE SAME CONTENT
- Technical dashboards, API logs, and administrative interfaces are NOT propaganda - they are functional UIs
- Marketing language ("state-of-the-art", "flagship", "best-in-class") in product descriptions is NORMAL commercial speech, not manipulation - score these as Tier 1-2 maximum unless combined with political/ideological content

CONTENT TYPE AWARENESS:
- API dashboards, settings pages, documentation = NOT propaganda (Tier 1)
- Product marketing without political angle = mild bias at most (Tier 1-2)
- News/opinion articles = analyze normally
- Political content = analyze thoroughly

If no propaganda is detected, explain why the content appears neutral and factual.

CONTENT TO ANALYZE:`;
}

// For backward compatibility, export a function that generates the prompt
const SYSTEM_PROMPT = getSystemPrompt();

// ============================================================================
// SENTINEL MODE - Auto-scanning functionality
// ============================================================================

// Default whitelist domains (used for initializing settings, not hardcoded)
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

// History configuration
const HISTORY_CONFIG = {
  checkWindow: 60 * 60 * 1000 // 1 hour in milliseconds - don't reanalyze if analyzed within this time
};

// Sentinel scan delay (3 seconds after page load)
const SENTINEL_DELAY = 3000;

// Normalize URL for consistent comparison (removes trailing slash, query params, hash, normalizes case)
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Reconstruct URL with only essential parts: protocol, hostname, pathname
    // Remove trailing slash from pathname, convert to lowercase for hostname
    let pathname = urlObj.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    const normalized = `${urlObj.protocol}//${urlObj.hostname.toLowerCase()}${pathname}`;
    return normalized;
  } catch (e) {
    // If URL parsing fails, return original (shouldn't happen for valid URLs)
    return url;
  }
}

// Get domain from URL
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return '';
  }
}

// Check if domain is whitelisted
async function isDomainWhitelisted(domain) {
  try {
    const result = await chrome.storage.sync.get(['sentinelWhitelist']);
    const whitelist = result.sentinelWhitelist || [];
    
    // If whitelist is empty, initialize it with defaults (first time setup)
    if (whitelist.length === 0) {
      await chrome.storage.sync.set({ sentinelWhitelist: [...DEFAULT_WHITELIST_DOMAINS] });
      return DEFAULT_WHITELIST_DOMAINS.some(whitelisted => {
        if (domain.includes(whitelisted) || whitelisted.includes(domain)) {
          return true;
        }
        return false;
      });
    }
    
    return whitelist.some(whitelisted => {
      if (domain.includes(whitelisted) || whitelisted.includes(domain)) {
        return true;
      }
      return false;
    });
  } catch (e) {
    console.error('[Sentinel] Error checking whitelist:', e);
    return false;
  }
}

// Check if URL was analyzed recently (within 1 hour)
async function wasAnalyzedRecently(url) {
  try {
    const normalizedUrl = normalizeUrl(url);
    const result = await chrome.storage.local.get(['analysisHistory']);
    const history = result.analysisHistory || [];
    
    const now = Date.now();
    const oneHourAgo = now - HISTORY_CONFIG.checkWindow;
    
    // Check if this URL was analyzed in the last hour (normalize both URLs for comparison)
    const recentAnalysis = history.find(entry => {
      // Use normalizedUrl if it exists (new entries), otherwise normalize the stored URL (old entries)
      const entryNormalized = entry.normalizedUrl || normalizeUrl(entry.url);
      return entryNormalized === normalizedUrl && entry.timestamp > oneHourAgo;
    });
    
    if (recentAnalysis) {
      const minutesAgo = Math.floor((now - recentAnalysis.timestamp) / 1000 / 60);
      console.log(`[Sentinel] URL analyzed ${minutesAgo} minutes ago, skipping reanalysis`);
      console.log(`[Sentinel] Matched URL: ${url} -> ${normalizedUrl}`);
      return { analyzed: true, minutesAgo, entry: recentAnalysis };
    }
    
    return { analyzed: false };
  } catch (e) {
    console.error('[Sentinel] Error checking history:', e);
    return { analyzed: false };
  }
}

// Add analysis to history
async function addToHistory(url, analysisResult, metadata = {}) {
  try {
    // Store both original and normalized URL for lookup
    const normalizedUrl = normalizeUrl(url);
    const result = await chrome.storage.local.get(['analysisHistory']);
    const history = result.analysisHistory || [];
    
    const now = Date.now();
    
    // Check for duplicate entries (same normalized URL within last 10 seconds to prevent race conditions)
    const recentDuplicate = history.find(entry => {
      const entryNormalized = entry.normalizedUrl || normalizeUrl(entry.url);
      const timeDiff = Math.abs(now - entry.timestamp);
      return entryNormalized === normalizedUrl && timeDiff < 10000; // 10 seconds
    });
    
    if (recentDuplicate) {
      console.log('[Sentinel] Duplicate entry detected within 10 seconds, skipping:', normalizedUrl);
      return recentDuplicate; // Return existing entry instead of creating duplicate
    }
    
    const entry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url: url, // Store original URL for display
      normalizedUrl: normalizedUrl, // Store normalized for matching
      domain: getDomain(url),
      title: metadata.title || new URL(url).hostname,
      timestamp: now,
      score: analysisResult.manipulation_score || 0,
      tier: analysisResult.tier || 1,
      severity: analysisResult.overall_severity || 'none',
      contains_propaganda: analysisResult.contains_propaganda || false,
      result: analysisResult,
      metadata: metadata
    };
    
    // Add to beginning of history (most recent first)
    history.unshift(entry);
    
    // Keep only last 1000 entries to prevent storage bloat
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    await chrome.storage.local.set({ analysisHistory: history });
    console.log('[Sentinel] Added to history:', url, '(normalized:', normalizedUrl + ')');
    return entry;
  } catch (e) {
    console.error('[Sentinel] Error adding to history:', e);
  }
}

// Check cache for existing result (checks both cache and history)
async function getCachedResult(url) {
  try {
    const normalizedUrl = normalizeUrl(url);
    console.log(`[Sentinel] Checking cache for URL: ${url} (normalized: ${normalizedUrl})`);
    
    // First check history (most recent analysis within 1 hour)
    const historyCheck = await wasAnalyzedRecently(url);
    if (historyCheck.analyzed && historyCheck.entry) {
      console.log('[Sentinel] Using history result for:', normalizedUrl);
      return {
        result: historyCheck.entry.result,
        score: historyCheck.entry.score,
        tier: historyCheck.entry.tier,
        severity: historyCheck.entry.severity,
        timestamp: historyCheck.entry.timestamp,
        metadata: historyCheck.entry.metadata || {
          url: historyCheck.entry.url,
          title: historyCheck.entry.title,
          domain: historyCheck.entry.domain,
          timestamp: historyCheck.entry.timestamp
        }
      };
    }

    // Fallback to old cache system (for backward compatibility)
    // Check both normalized and original URL
    const result = await chrome.storage.local.get(['sentinelCache']);
    const cache = result.sentinelCache || {};
    
    // Try normalized URL first, then original
    let cached = cache[normalizedUrl] || cache[url];
    const cacheKey = cache[normalizedUrl] ? normalizedUrl : (cache[url] ? url : null);

    if (cached && cacheKey) {
      const now = Date.now();
      const cacheDuration = await getCacheDuration();
      
      if (now - cached.timestamp < cacheDuration) {
        console.log('[Sentinel] Using cached result for:', cacheKey);
        return cached;
      } else {
        // Expired, remove it
        delete cache[cacheKey];
        await chrome.storage.local.set({ sentinelCache: cache });
      }
    }

    return null;
  } catch (e) {
    console.error('[Sentinel] Error checking cache:', e);
    return null;
  }
}

// Get cache duration from settings
async function getCacheDuration() {
  try {
    const result = await chrome.storage.sync.get(['sentinelCacheDuration']);
    const hours = result.sentinelCacheDuration || 24;
    return hours * 60 * 60 * 1000;
  } catch (e) {
    return CACHE_CONFIG.duration;
  }
}

// Save result to cache
async function saveToCache(url, analysisResult) {
  try {
    const normalizedUrl = normalizeUrl(url);
    const result = await chrome.storage.local.get(['sentinelCache']);
    const cache = result.sentinelCache || {};

    // Store using normalized URL as key for consistent lookup
    cache[normalizedUrl] = {
      url: url, // Store original URL
      normalizedUrl: normalizedUrl,
      score: analysisResult.manipulation_score || 0,
      tier: analysisResult.tier || 1,
      severity: analysisResult.overall_severity || 'none',
      timestamp: Date.now(),
      result: analysisResult
    };

    await chrome.storage.local.set({ sentinelCache: cache });
    console.log('[Sentinel] Result cached for:', normalizedUrl);
  } catch (e) {
    console.error('[Sentinel] Error saving to cache:', e);
  }
}

// Update badge based on score
function updateBadge(tabId, score, state = 'complete') {
  if (state === 'scanning') {
    chrome.action.setBadgeText({ text: '...', tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea', tabId: tabId });
  } else if (state === 'error') {
    chrome.action.setBadgeText({ text: '!', tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#999999', tabId: tabId });
  } else if (state === 'complete') {
    let color, text;
    if (score >= 0 && score <= 25) {
      color = '#28a745'; // Green
      text = '✓';
    } else if (score >= 26 && score <= 50) {
      color = '#ffc107'; // Yellow
      text = '!';
    } else if (score >= 51 && score <= 75) {
      color = '#fd7e14'; // Orange
      text = '!!';
    } else {
      color = '#dc3545'; // Red
      text = '!!!';
    }
    chrome.action.setBadgeText({ text: text, tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: color, tabId: tabId });
  } else if (state === 'clear') {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
}

// Perform Sentinel scan
async function performSentinelScan(tabId, url) {
  try {
    console.log('[Sentinel] Starting scan for:', url);

    // Set scanning badge
    updateBadge(tabId, 0, 'scanning');

    // Track current scan
    await chrome.storage.local.set({ sentinelCurrentScan: tabId });

    // Inject page extractor
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['pageExtractor.js']
    });

    // Wait for injection
    await new Promise(resolve => setTimeout(resolve, 500));

    // Extract content
    const extractionResponse = await chrome.tabs.sendMessage(tabId, { action: 'extractPageContent' });
    
    if (!extractionResponse || !extractionResponse.success) {
      throw new Error('Failed to extract page content');
    }

    const { text, images, metadata } = extractionResponse.content;

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found');
    }

    // Prepare images
    const imageDataUrls = [];
    for (const img of images.slice(0, 10)) {
      if (img.src && !img.isUrl) {
        imageDataUrls.push(img.src);
      }
    }
    const primaryImage = imageDataUrls.length > 0 ? imageDataUrls[0] : '';

    // Get config from sync storage (popup saves it there)
    const configResult = await chrome.storage.sync.get(['propaScanConfig']);
    let config = configResult.propaScanConfig;
    
    console.log('[Sentinel] Config loaded from storage:', !!config);
    
    if (!config) {
      console.log('[Sentinel] Config not in storage, trying to load from config.js via popup...');
      // Try to trigger popup to save config (if it hasn't been opened yet)
      // For now, use defaults but log a warning
      config = {
        HACKCLUB_AI_API_URL: 'https://ai.hackclub.com/proxy/v1/chat/completions',
        AI_MODEL: 'google/gemini-3-pro-preview',
        TEMPERATURE: 0.7,
        MAX_TOKENS: 16000,
        TOP_P: 1.0,
        HACK_CLUB_AI_API_KEY: ''
      };
      console.warn('[Sentinel] Using default config - API key may be missing. Open popup once to save config.');
    }
    
    // Ensure MAX_TOKENS is at least 16000 for Sentinel mode
    if (!config.MAX_TOKENS || config.MAX_TOKENS < 16000) {
      config.MAX_TOKENS = 16000;
    }
    
    console.log('[Sentinel] API key present:', !!config.HACK_CLUB_AI_API_KEY && config.HACK_CLUB_AI_API_KEY !== 'your_api_key_here');

    // Build API request
    let userMessage = `CONTENT TO ANALYZE:\n\n`;
    if (text && text.trim().length > 0) {
      userMessage += `TEXT:\n${text}\n\n`;
    }
    if (primaryImage) {
      userMessage += `IMAGE:\n[Image is attached below]`;
    }

    const messages = [
      {
        role: 'system',
        content: getSystemPrompt()
      }
    ];

    if (primaryImage && text && text.trim().length > 0) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userMessage },
          { type: 'image_url', image_url: { url: primaryImage } }
        ]
      });
    } else if (primaryImage) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userMessage },
          { type: 'image_url', image_url: { url: primaryImage } }
        ]
      });
    } else if (text && text.trim().length > 0) {
      messages.push({
        role: 'user',
        content: userMessage
      });
    }

    // Make API call
    const apiUrl = config.HACKCLUB_AI_API_URL || 'https://ai.hackclub.com/proxy/v1/chat/completions';
    const apiKey = config.HACK_CLUB_AI_API_KEY || '';
    const model = config.AI_MODEL || 'google/gemini-3-pro-preview';
    const temperature = config.TEMPERATURE || 0.7;
    const maxTokens = config.MAX_TOKENS || 16000;
    const topP = config.TOP_P || 1.0;

    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('API key not configured. Please set it in config.js and reload the extension.');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: { type: 'json_object' },
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: topP
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const responseData = await response.json();
    const content = responseData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in API response');
    }

    // Parse JSON
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON response');
      }
    }

    // Save to cache (for backward compatibility)
    await saveToCache(url, analysisResult);

    // Add to history
    const domain = getDomain(url);
    await addToHistory(url, analysisResult, { 
      title: metadata?.title || '',
      domain: domain 
    });

    // Update badge
    const score = analysisResult.manipulation_score || 0;
    updateBadge(tabId, score, 'complete');

    // Clear current scan tracking
    await chrome.storage.local.remove(['sentinelCurrentScan']);

    console.log('[Sentinel] Scan completed, score:', score);
    return analysisResult;

  } catch (error) {
    console.error('[Sentinel] Scan error:', error);
    updateBadge(tabId, 0, 'error');
    await chrome.storage.local.remove(['sentinelCurrentScan']);
    throw error;
  }
}

// Handle navigation updates (Sentinel Mode)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when page is fully loaded
  if (changeInfo.status !== 'complete') {
    return;
  }

  // Only process http/https URLs
  if (!tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
    return;
  }

  // Check if Sentinel mode is enabled
  try {
    const result = await chrome.storage.sync.get(['detectionMode']);
    console.log('[Sentinel] Navigation detected, mode:', result.detectionMode, 'URL:', tab.url);
    
    if (result.detectionMode !== 'sentinel') {
      console.log('[Sentinel] Not in Sentinel mode, skipping');
      return;
    }

    const url = tab.url;
    const domain = getDomain(url);
    console.log('[Sentinel] Domain:', domain);

    // Check whitelist
    const whitelisted = await isDomainWhitelisted(domain);
    if (whitelisted) {
      console.log('[Sentinel] Domain is whitelisted, skipping:', domain);
      updateBadge(tabId, 0, 'clear');
      return;
    }

    // Check if analyzed recently (within 1 hour)
    const recentCheck = await wasAnalyzedRecently(url);
    if (recentCheck.analyzed) {
      console.log('[Sentinel] URL analyzed recently, using history result');
      updateBadge(tabId, recentCheck.entry.score, 'complete');
      return;
    }

    // Wait for delay before scanning
    const delayResult = await chrome.storage.sync.get(['sentinelDelay']);
    const delay = delayResult.sentinelDelay || 3;
    console.log('[Sentinel] Will scan in', delay, 'seconds');
    
    setTimeout(async () => {
      // Check if tab still exists and URL hasn't changed
      try {
        const currentTab = await chrome.tabs.get(tabId);
        if (currentTab.url !== url) {
          console.log('[Sentinel] URL changed, cancelling scan');
          return;
        }

        // Check if still in Sentinel mode
        const modeCheck = await chrome.storage.sync.get(['detectionMode']);
        if (modeCheck.detectionMode !== 'sentinel') {
          console.log('[Sentinel] Mode changed, cancelling scan');
          return;
        }

        console.log('[Sentinel] Starting scan after delay');
        // Perform scan
        await performSentinelScan(tabId, url);
      } catch (e) {
        // Tab might have been closed
        console.log('[Sentinel] Tab no longer available:', e.message);
      }
    }, delay * 1000);

  } catch (error) {
    console.error('[Sentinel] Error in navigation listener:', error);
  }
});

// Clean expired cache entries periodically
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(['sentinelCache']);
    const cache = result.sentinelCache || {};
    const cacheDuration = await getCacheDuration();
    const now = Date.now();

    let cleaned = false;
    for (const url in cache) {
      if (now - cache[url].timestamp >= cacheDuration) {
        delete cache[url];
        cleaned = true;
      }
    }

    if (cleaned) {
      await chrome.storage.local.set({ sentinelCache: cache });
      console.log('[Sentinel] Cleaned expired cache entries');
    }
  } catch (e) {
    console.error('[Sentinel] Error cleaning cache:', e);
  }
}, 60 * 60 * 1000); // Run every hour

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeContent') {
    handleAnalyzeRequest(request.data, sendResponse);
    return true; // Keep the message channel open for async response
  } else if (request.action === 'approveSelection') {
    handleApproveSelection(request.data, request.type);
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'captureArea') {
    handleCaptureArea(request.rect, sender.tab.id);
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'extractPageContent') {
    // This is handled by content script, but we can forward it
    // The content script will respond directly
    return true;
  } else if (request.action === 'getCachedResult') {
    // Get cached result for current URL
    getCachedResult(request.url).then(result => {
      sendResponse({ success: true, cached: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'rescanPage') {
    // Force rescan (bypasses cache)
    performSentinelScan(sender.tab.id, request.url).then(result => {
      sendResponse({ success: true, result: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'addToWhitelist') {
    // Add domain to whitelist
    addDomainToWhitelist(request.domain).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  return false;
});

// Add domain to whitelist
async function addDomainToWhitelist(domain) {
  try {
    const result = await chrome.storage.sync.get(['sentinelWhitelist']);
    const whitelist = result.sentinelWhitelist || DEFAULT_WHITELIST;
    
    if (!whitelist.includes(domain)) {
      whitelist.push(domain);
      await chrome.storage.sync.set({ sentinelWhitelist: whitelist });
      console.log('[Sentinel] Added to whitelist:', domain);
    }
  } catch (e) {
    console.error('[Sentinel] Error adding to whitelist:', e);
    throw e;
  }
}

// Handle approved selection (everything is now screenshot-based)
async function handleApproveSelection(data, type) {
  // Save screenshot to storage
  // Popup will pick it up when user reopens it
  await chrome.storage.local.set({
    selectedScreenshot: data,
    selectionType: 'screenshot'
  });
  console.log('Screenshot saved, user can reopen popup to see it');
}

// Handle area capture - capture full screenshot and send to content script to crop
async function handleCaptureArea(rect, tabId) {
  try {
    // Small delay to ensure any UI elements are removed from DOM
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Capture the visible tab (full screenshot) - no UI should be visible now
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // Send full screenshot and rect to content script for cropping
    // Content script will show loading overlay when it receives this
    await chrome.tabs.sendMessage(tabId, {
      action: 'cropScreenshot',
      screenshot: dataUrl,
      rect: rect
    });
  } catch (error) {
    console.error('Error capturing area:', error);
  }
}

async function handleAnalyzeRequest(data, sendResponse) {
  try {
    const { textContent, imageDataUrl, config } = data;
    
    // Mark analysis as in progress and save original content
    await chrome.storage.local.set({ 
      analysisStatus: 'in_progress',
      analysisError: null,
      originalImage: imageDataUrl || '',
      originalText: textContent || '' // Save text for Patrol Mode
    });

    // Load config from storage or use provided config
    // Hack Club AI uses: https://ai.hackclub.com/proxy/v1/chat/completions
    const apiUrl = config?.HACKCLUB_AI_API_URL || 'https://ai.hackclub.com/proxy/v1/chat/completions';
    const apiKey = config?.HACK_CLUB_AI_API_KEY || '';
    const model = config?.AI_MODEL || 'google/gemini-3-pro-preview';
    const temperature = config?.TEMPERATURE || 0.7;
    const maxTokens = config?.MAX_TOKENS || 16000; // Increased default for comprehensive analysis
    const topP = config?.TOP_P || 1.0;

    console.log('Background: Received analyze request');
    console.log('Background: API URL:', apiUrl);
    console.log('Background: API Key present:', !!apiKey && apiKey !== 'your_api_key_here');

    if (!apiKey || apiKey === 'your_api_key_here') {
      const error = 'API key not configured';
      await chrome.storage.local.set({ 
        analysisStatus: 'error',
        analysisError: error
      });
      sendResponse({ error: error });
      return;
    }

    // Validate that we have at least text or image
    if (!textContent && !imageDataUrl) {
      const error = 'No content provided for analysis (neither text nor image)';
      await chrome.storage.local.set({ 
        analysisStatus: 'error',
        analysisError: error
      });
      sendResponse({ error: error });
      return;
    }
    
    // For Patrol Mode, text is required
    if (!textContent || textContent.trim().length === 0) {
      console.warn('[Background] No text content - this might be a screenshot-only analysis');
    }

    // Build the user message - include text if provided
    let userMessage = `CONTENT TO ANALYZE:\n\n`;
    
    if (textContent && textContent.trim().length > 0) {
      userMessage += `TEXT:\n${textContent}\n\n`;
      console.log('[Background] Text content length:', textContent.length);
      console.log('[Background] Text preview (first 500 chars):', textContent.substring(0, 500));
    } else {
      console.warn('[Background] No text content provided');
    }
    
    if (imageDataUrl) {
      userMessage += `IMAGE:\n[Image is attached below]`;
      console.log('[Background] Image provided:', imageDataUrl.substring(0, 50) + '...');
    } else {
      console.warn('[Background] No image provided');
    }

    // Prepare messages
    const messages = [
      {
        role: 'system',
        content: data.systemPrompt || getSystemPrompt()
      }
    ];

    // If both text and image are provided, use vision format with text
    if (imageDataUrl && textContent && textContent.trim().length > 0) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage
          },
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl
            }
          }
        ]
      });
    } else if (imageDataUrl) {
      // Only image
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage
          },
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl
            }
          }
        ]
      });
    } else if (textContent && textContent.trim().length > 0) {
      // Only text
      messages.push({
        role: 'user',
        content: userMessage
      });
    } else {
      // Neither provided
      const error = 'No content provided for analysis (neither text nor image)';
      await chrome.storage.local.set({ 
        analysisStatus: 'error',
        analysisError: error
      });
      sendResponse({ error: error });
      return;
    }

    // Make API request
    console.log('Background: Making fetch request to:', apiUrl);
    
    const requestBody = {
      model: model,
      messages: messages,
      response_format: { type: 'json_object' },
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Background: Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Background: API error response:', errorData);
      const errorMsg = `API request failed: ${response.status} ${response.statusText} - ${errorData}`;
      await chrome.storage.local.set({ 
        analysisStatus: 'error',
        analysisError: errorMsg
      });
      sendResponse({ error: errorMsg });
      return;
    }

    const responseData = await response.json();
    console.log('Background: Received response data');
    const content = responseData.choices[0]?.message?.content;

    if (!content) {
      console.error('Background: No content in response:', responseData);
      const errorMsg = 'No content in API response';
      await chrome.storage.local.set({ 
        analysisStatus: 'error',
        analysisError: errorMsg
      });
      sendResponse({ error: errorMsg });
      return;
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      console.log('Background: Successfully parsed JSON response');
      
      // Save results to storage (analysis continues in background even if popup closes)
      // Original content is already saved above
      await chrome.storage.local.set({ 
        analysisResult: parsed,
        analysisStatus: 'completed',
        analysisError: null
      });
      
      // Add to history if we have URL (from Patrol Mode or manual analysis)
      // For Sentinel mode, history is already saved in performSentinelScan
      if (data.url) {
        await addToHistory(data.url, parsed, {
          title: data.title || '',
          domain: getDomain(data.url)
        });
      }
      
      sendResponse({ result: parsed });
    } catch (parseError) {
      console.error('Background: JSON parse error:', parseError);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Save results to storage (original content already saved)
        await chrome.storage.local.set({ 
          analysisResult: parsed,
          analysisStatus: 'completed',
          analysisError: null
        });
        
        // Add to history if we have URL
        if (data.url) {
          await addToHistory(data.url, parsed, {
            title: data.title || '',
            domain: getDomain(data.url)
          });
        }
        
        sendResponse({ result: parsed });
      } else {
        const parseErrorMsg = 'Failed to parse JSON response: ' + parseError.message;
        await chrome.storage.local.set({ 
          analysisStatus: 'error',
          analysisError: parseErrorMsg
        });
        sendResponse({ error: parseErrorMsg });
      }
    }
  } catch (error) {
    console.error('Background script error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Unknown error occurred';
    if (error.message.includes('Failed to fetch')) {
      errorMessage = `Network error: Unable to connect to API endpoint. Please verify:\n1. The API endpoint URL is correct\n2. Your internet connection is working\n3. The API key is valid\n\nOriginal error: ${error.message}`;
    }
    
    // Save error to storage
    await chrome.storage.local.set({ 
      analysisStatus: 'error',
      analysisError: errorMessage
    });
    
    sendResponse({ error: errorMessage });
  }
}
