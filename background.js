// Background service worker for PropaScan Extension
// Handles API requests to avoid CORS issues

// System prompt for propaganda analysis
const SYSTEM_PROMPT = `You are a propaganda and manipulation detection expert. Analyze the following content and identify any propaganda techniques, bias, or manipulation being used.

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

Respond in JSON format:
{
  "content_type": "text/image/both",
  "contains_propaganda": true/false,
  "manipulation_score": 0-100,
  "political_leaning": "left/center/right/none",
  "source_credibility": "reliable/questionable/unverified",
  "overall_severity": "none/low/medium/high",
  "analysis": {
    "text_analysis": {
      "tone": "description of overall tone",
      "framing": "how the narrative is framed",
      "missing_context": "what information is omitted or downplayed"
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
      "confidence": "high/medium/low",
      "explanation": "why this is propaganda and emotional intent"
    }
  ],
  "text_visual_synergy": "how text and image work together (null if only one is present)",
  "credibility_red_flags": ["list of reasons to be skeptical"],
  "neutral_rewrite": "how this content could be presented without manipulation (for text only)"
}

If no propaganda is detected, explain why the content appears neutral and factual.

CONTENT TO ANALYZE:`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeContent') {
    handleAnalyzeRequest(request.data, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function handleAnalyzeRequest(data, sendResponse) {
  try {
    const { textContent, imageDataUrl, config } = data;
    
    // Mark analysis as in progress and save original content
    await chrome.storage.local.set({ 
      analysisStatus: 'in_progress',
      analysisError: null,
      originalText: textContent || '',
      originalImage: imageDataUrl || ''
    });

    // Load config from storage or use provided config
    // Hack Club AI uses: https://ai.hackclub.com/proxy/v1/chat/completions
    const apiUrl = config?.HACKCLUB_AI_API_URL || 'https://ai.hackclub.com/proxy/v1/chat/completions';
    const apiKey = config?.HACK_CLUB_AI_API_KEY || '';
    const model = config?.AI_MODEL || 'google/gemini-3-pro-preview';
    const temperature = config?.TEMPERATURE || 0.7;
    const maxTokens = config?.MAX_TOKENS || 4000;
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

    // Build the user message
    let userMessage = '';
    if (imageDataUrl && textContent) {
      userMessage = `CONTENT TO ANALYZE:\n\nTEXT:\n${textContent}\n\nIMAGE:\n[Image is attached below]`;
    } else if (textContent) {
      userMessage = `CONTENT TO ANALYZE:\n\nTEXT:\n${textContent}`;
    } else if (imageDataUrl) {
      userMessage = `CONTENT TO ANALYZE:\n\nIMAGE:\n[Image is attached below]`;
    } else {
      sendResponse({ error: 'No content provided for analysis' });
      return;
    }

    // Prepare messages
    const messages = [
      {
        role: 'system',
        content: data.systemPrompt || SYSTEM_PROMPT
      }
    ];

    // If image is provided, use vision format
    if (imageDataUrl) {
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
    } else {
      messages.push({
        role: 'user',
        content: userMessage
      });
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
