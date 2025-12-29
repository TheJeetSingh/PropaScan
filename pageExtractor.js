// Page content extractor for PropaScan Patrol Mode
// Extracts text and images from web pages for analysis

// Listen for extraction requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPageContent') {
    extractPageContent()
      .then(content => sendResponse({ success: true, content }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

/**
 * Extract main content from the current page
 * Returns: { text, images, metadata }
 */
async function extractPageContent() {
  // Wait for page to be fully loaded
  if (document.readyState !== 'complete') {
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  // Additional small delay for dynamic content
  await new Promise(resolve => setTimeout(resolve, 500));

  const metadata = {
    url: window.location.href,
    title: document.title || '',
    domain: window.location.hostname,
    timestamp: new Date().toISOString()
  };

  // Find main content area
  const mainContent = findMainContent();
  
  // Extract text
  const text = extractText(mainContent);
  
  // Extract images
  const images = await extractImages(mainContent);

  // Debug logging
  console.log('[PageExtractor] Extracted text length:', text.length);
  console.log('[PageExtractor] First 500 chars:', text.substring(0, 500));
  console.log('[PageExtractor] Number of images:', images.length);
  console.log('[PageExtractor] Main content element:', mainContent?.tagName, mainContent?.className);

  return {
    text,
    images,
    metadata
  };
}

/**
 * Find the main content area of the page
 */
function findMainContent() {
  // Try semantic HTML elements first
  let mainContent = document.querySelector('article') ||
                    document.querySelector('main') ||
                    document.querySelector('[role="article"]') ||
                    document.querySelector('[role="main"]');

  // Try common class names
  if (!mainContent) {
    const commonSelectors = [
      '.post',
      '.article',
      '.content',
      '.post-body',
      '.entry-content',
      '.article-content',
      '.story-body',
      '.article-body',
      '#content',
      '#main-content',
      '.main-content'
    ];

    for (const selector of commonSelectors) {
      mainContent = document.querySelector(selector);
      if (mainContent) break;
    }
  }

  // Fall back to body if nothing found
  if (!mainContent) {
    mainContent = document.body;
  }

  // Remove unwanted elements
  const unwantedSelectors = [
    'nav', 'header', 'footer', 'aside', '.sidebar', '.navigation',
    '.nav', '.menu', '.ad', '.advertisement', '.ads', '.ad-container',
    '.social-share', '.share-buttons', '.comments', '.comment-section',
    '.related-posts', '.related-articles', '.newsletter', '.subscribe',
    'script', 'style', 'noscript', 'iframe'
  ];

  unwantedSelectors.forEach(selector => {
    const elements = mainContent.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  return mainContent;
}

/**
 * Extract clean text from the content area
 */
function extractText(contentElement) {
  if (!contentElement) return '';

  // Get text content, preserving some structure
  let text = contentElement.innerText || contentElement.textContent || '';

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n\n') // Multiple newlines to double newline
    .trim();

  // Cap at 100,000 characters for long articles (Gemini 3 Pro can handle large inputs)
  // Prioritize beginning content but try to preserve structure
  const MAX_LENGTH = 100000;
  if (text.length > MAX_LENGTH) {
    console.log(`[PageExtractor] Text exceeds ${MAX_LENGTH} chars (${text.length}), truncating...`);
    
    // Try to cut at a paragraph boundary (double newline)
    const truncated = text.substring(0, MAX_LENGTH);
    const lastParagraph = truncated.lastIndexOf('\n\n');
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    
    // Prefer paragraph breaks, then sentence breaks, then line breaks
    let cutPoint = lastParagraph;
    if (lastParagraph < MAX_LENGTH * 0.7) {
      cutPoint = Math.max(lastPeriod, lastNewline);
    }
    
    if (cutPoint > MAX_LENGTH * 0.8) {
      text = truncated.substring(0, cutPoint + 1) + '\n\n[Content truncated - article is very long. First ~' + Math.round(MAX_LENGTH / 1000) + 'k characters analyzed.]';
    } else {
      text = truncated + '\n\n[Content truncated - article is very long. First ~' + Math.round(MAX_LENGTH / 1000) + 'k characters analyzed.]';
    }
    
    console.log(`[PageExtractor] Truncated to ${text.length} characters`);
  }

  return text;
}

/**
 * Extract relevant images from the content area
 */
async function extractImages(contentElement) {
  if (!contentElement) return [];

  const images = [];
  const imgElements = contentElement.querySelectorAll('img');

  for (const img of imgElements) {
    // Skip if image is too small (likely icon or spacer)
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    
    if (width < 200 || height < 200) {
      continue;
    }

    // Skip if image is hidden
    const style = window.getComputedStyle(img);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      continue;
    }

    // Skip decorative images (alt text patterns)
    const alt = (img.alt || '').toLowerCase();
    if (alt.includes('icon') || alt.includes('logo') || alt.includes('spacer') || 
        alt.includes('decoration') || alt.includes('bullet')) {
      continue;
    }

    // Get image source
    let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    
    if (!src || src.startsWith('data:')) {
      continue; // Skip data URIs and empty sources
    }

    // Convert to absolute URL if relative
    if (src.startsWith('//')) {
      src = window.location.protocol + src;
    } else if (src.startsWith('/')) {
      src = window.location.origin + src;
    } else if (!src.startsWith('http')) {
      src = new URL(src, window.location.href).href;
    }

    // Try to convert to base64
    try {
      const base64 = await imageToBase64(src);
      if (base64) {
        images.push({
          src: base64,
          alt: img.alt || '',
          width: width,
          height: height
        });
      }
    } catch (error) {
      console.warn('Failed to convert image to base64:', src, error);
      // Fallback: use URL if base64 conversion fails
      images.push({
        src: src,
        alt: img.alt || '',
        width: width,
        height: height,
        isUrl: true
      });
    }

    // Limit to 10 images
    if (images.length >= 10) {
      break;
    }
  }

  return images;
}

/**
 * Convert image URL to base64 data URL
 */
function imageToBase64(url) {
  return new Promise((resolve, reject) => {
    // Check if image is from same origin (CORS)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = function() {
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

