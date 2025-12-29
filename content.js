// Content script for PropaScan Extension
// Handles screenshot area selection (everything is now vision-based)

let selectionMode = 'none'; // 'area' or 'none'
let selectionOverlay = null;
let selectionRect = null;
let startX = 0, startY = 0;
let isSelecting = false;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAreaSelection') {
    startAreaSelection();
    sendResponse({ success: true });
  } else if (request.action === 'stopSelection') {
    stopSelection();
    sendResponse({ success: true });
  } else if (request.action === 'showApprovalOverlay') {
    showApprovalOverlay(request.data, request.type);
    sendResponse({ success: true });
  } else if (request.action === 'cropScreenshot') {
    // Screenshot has been captured, now show loading overlay and crop
    showLoadingOverlay();
    cropScreenshot(request.screenshot, request.rect);
    sendResponse({ success: true });
  }
  return true;
});



function startAreaSelection() {
  if (selectionMode !== 'none') return;
  
  selectionMode = 'area';
  isSelecting = false;
  selectionRect = null;
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'propascan-selection-overlay';
  overlay.innerHTML = `
    <div class="propascan-instructions">
      <h3>Select Area to Screenshot</h3>
      <p>Click and drag to select an area on the page</p>
      <button id="propascan-cancel-selection">Cancel</button>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // Create selection rectangle
  const rect = document.createElement('div');
  rect.id = 'propascan-selection-rect';
  document.body.appendChild(rect);
  
  // Handle mouse events for area selection
  document.addEventListener('mousedown', handleAreaMouseDown, true);
  document.addEventListener('mousemove', handleAreaMouseMove, true);
  document.addEventListener('mouseup', handleAreaMouseUp, true);
  document.addEventListener('keydown', handleEscapeKey);
  
  // Cancel button
  document.getElementById('propascan-cancel-selection').addEventListener('click', () => {
    stopSelection();
  });
}

function handleAreaMouseDown(e) {
  if (selectionMode !== 'area') return;
  
  isSelecting = true;
  const rect = document.getElementById('propascan-selection-rect');
  const overlay = document.getElementById('propascan-selection-overlay');
  
  // Hide instructions
  if (overlay) {
    overlay.style.display = 'none';
  }
  
  startX = e.clientX;
  startY = e.clientY;
  
  rect.style.left = startX + 'px';
  rect.style.top = startY + 'px';
  rect.style.width = '0px';
  rect.style.height = '0px';
  rect.style.display = 'block';
  
  e.preventDefault();
  e.stopPropagation();
}

function handleAreaMouseMove(e) {
  if (!isSelecting || selectionMode !== 'area') return;
  
  const rect = document.getElementById('propascan-selection-rect');
  if (!rect) return;
  
  const currentX = e.clientX;
  const currentY = e.clientY;
  
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  rect.style.left = left + 'px';
  rect.style.top = top + 'px';
  rect.style.width = width + 'px';
  rect.style.height = height + 'px';
  
  e.preventDefault();
  e.stopPropagation();
}

function handleAreaMouseUp(e) {
  if (!isSelecting || selectionMode !== 'area') return;
  
  isSelecting = false;
  const rect = document.getElementById('propascan-selection-rect');
  if (!rect) return;
  
  const width = parseInt(rect.style.width);
  const height = parseInt(rect.style.height);
  
  // Only proceed if selection has meaningful size
  if (width > 10 && height > 10) {
    const left = parseInt(rect.style.left);
    const top = parseInt(rect.style.top);
    
    // Get the selection bounds relative to viewport
    // NOTE: Don't add scroll offsets because captureVisibleTab only captures the visible viewport
    selectionRect = {
      x: left,
      y: top,
      width: width,
      height: height
    };
    
    // Remove selection rectangle and instructions from DOM completely
    rect.remove();
    const overlay = document.getElementById('propascan-selection-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    // Stop selection mode immediately to prevent further interactions
    selectionMode = 'none';
    
    // Remove all event listeners to prevent any UI from appearing
    document.removeEventListener('mousedown', handleAreaMouseDown, true);
    document.removeEventListener('mousemove', handleAreaMouseMove, true);
    document.removeEventListener('mouseup', handleAreaMouseUp, true);
    document.removeEventListener('keydown', handleEscapeKey);
    
    // Use requestAnimationFrame to ensure UI is completely removed from DOM
    // and browser has had time to repaint before screenshot
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Request screenshot from background
        // Background will send 'aboutToCapture' message before capturing,
        // which will trigger the loading overlay to appear
        chrome.runtime.sendMessage({
          action: 'captureArea',
          rect: selectionRect
        }, (response) => {
          // Screenshot will be sent via cropScreenshot message
        });
      });
    });
  } else {
    // Selection too small, stop selection
    stopSelection();
  }
  
  e.preventDefault();
  e.stopPropagation();
}

function handleEscapeKey(e) {
  if (e.key === 'Escape' && selectionMode !== 'none') {
    stopSelection();
  }
}

function stopSelection() {
  selectionMode = 'none';
  isSelecting = false;
  document.body.style.cursor = '';
  
  const overlay = document.getElementById('propascan-selection-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  const rect = document.getElementById('propascan-selection-rect');
  if (rect) {
    rect.remove();
  }
  
  document.removeEventListener('mousedown', handleAreaMouseDown, true);
  document.removeEventListener('mousemove', handleAreaMouseMove, true);
  document.removeEventListener('mouseup', handleAreaMouseUp, true);
  document.removeEventListener('keydown', handleEscapeKey);
}

function showLoadingOverlay() {
  // Remove any existing overlay
  const existing = document.getElementById('propascan-approval-overlay');
  if (existing) {
    existing.remove();
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'propascan-approval-overlay';
  
  overlay.innerHTML = `
    <div class="propascan-approval-content">
      <h3>Processing Screenshot...</h3>
      <div class="propascan-loading-spinner" style="width: 40px; height: 40px; border: 4px solid rgba(102, 126, 234, 0.2); border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto;"></div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

function showApprovalOverlay(data, type) {
  // Remove any existing approval overlay (including loading overlay)
  const existing = document.getElementById('propascan-approval-overlay');
  if (existing) {
    existing.remove();
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'propascan-approval-overlay';
  
  // Everything is now screenshot-based
  overlay.innerHTML = `
    <div class="propascan-approval-content">
      <h3>Screenshot Captured</h3>
      <div class="propascan-preview-image">
        <img src="${data}" alt="Screenshot preview" />
      </div>
      <div class="propascan-approval-actions">
        <button id="propascan-approve-btn" class="propascan-btn-approve">Use This Screenshot</button>
        <button id="propascan-cancel-btn" class="propascan-btn-cancel">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Handle approve button
  document.getElementById('propascan-approve-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'approveSelection',
      data: data,
      type: 'screenshot'
    });
    overlay.remove();
    stopSelection();
  });
  
  // Handle cancel button
  document.getElementById('propascan-cancel-btn').addEventListener('click', () => {
    overlay.remove();
    stopSelection();
  });
}

function cropScreenshot(screenshotDataUrl, rect) {
  const img = new Image();
  img.src = screenshotDataUrl;

  img.onload = function() {
    try {
      console.log('[Screenshot] Image loaded:', {
        imgWidth: img.width,
        imgHeight: img.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        rect: rect
      });

      // Create canvas to crop the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate scale factor: screenshot dimensions / viewport dimensions
      // captureVisibleTab captures at device pixel ratio
      const scaleX = img.width / window.innerWidth;
      const scaleY = img.height / window.innerHeight;

      console.log('[Screenshot] Scale factors:', { scaleX, scaleY });

      // Calculate crop coordinates accounting for scale
      // rect coordinates are in CSS pixels, need to convert to screenshot pixels
      const cropX = Math.round(rect.x * scaleX);
      const cropY = Math.round(rect.y * scaleY);
      const cropWidth = Math.round(rect.width * scaleX);
      const cropHeight = Math.round(rect.height * scaleY);

      console.log('[Screenshot] Crop coordinates:', { cropX, cropY, cropWidth, cropHeight });

      // Validate crop coordinates are within screenshot bounds
      if (cropX < 0 || cropY < 0 || cropX + cropWidth > img.width || cropY + cropHeight > img.height) {
        console.error('[Screenshot] Crop coordinates out of bounds!', {
          cropX, cropY, cropWidth, cropHeight,
          imgWidth: img.width, imgHeight: img.height
        });
        // Fallback to full screenshot
        showApprovalOverlay(screenshotDataUrl, 'screenshot');
        return;
      }

      // Set canvas size to match the cropped area at scale
      // This preserves the quality of the screenshot
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Draw the cropped portion
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,  // Source rectangle
        0, 0, cropWidth, cropHeight           // Destination rectangle
      );

      // Convert to data URL
      const croppedDataUrl = canvas.toDataURL('image/png');

      console.log('[Screenshot] Cropped successfully');

      // Show approval overlay with cropped image
      showApprovalOverlay(croppedDataUrl, 'screenshot');
    } catch (error) {
      console.error('[Screenshot] Error cropping screenshot:', error);
      // Fallback: show full screenshot
      showApprovalOverlay(screenshotDataUrl, 'screenshot');
    }
  };

  img.onerror = function() {
    console.error('[Screenshot] Error loading screenshot for cropping');
    // Fallback: show full screenshot
    showApprovalOverlay(screenshotDataUrl, 'screenshot');
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
