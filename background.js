// Background service worker for PropaScan Extension
// Handles API requests to avoid CORS issues

// System prompt for propaganda analysis
const SYSTEM_PROMPT = `You are a propaganda and manipulation detection expert. Analyze the following content and identify any propaganda techniques, bias, or manipulation being used.

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

If no propaganda is detected, explain why the content appears neutral and factual.

CONTENT TO ANALYZE:`;

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
  }
  return false;
});

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
        content: data.systemPrompt || SYSTEM_PROMPT
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
