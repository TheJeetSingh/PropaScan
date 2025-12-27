# PropaScan - Propaganda Detection Chrome Extension

A Chrome extension that uses AI to detect propaganda, manipulation, and bias in text and images.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select this folder
5. The extension icon should appear in your Chrome toolbar

## Configuration

**IMPORTANT: You must configure your API key before using the extension.**

1. Copy the example configuration file:
   ```bash
   cp config.example.js config.js
   ```
   On Windows (PowerShell):
   ```powershell
   Copy-Item config.example.js config.js
   ```

2. Get your Hack Club AI API key from: https://hackclub.com/ai

3. Open `config.js` and replace `your_api_key_here` with your actual API key:
   ```javascript
   HACK_CLUB_AI_API_KEY: 'your_actual_api_key_here',
   ```

**Security Note:** The `config.js` file is gitignored to protect your API key. Never commit `config.js` to version control.

### Configuration Options

You can customize these settings in `config.js` (after copying from `config.example.js`):
- `HACK_CLUB_AI_API_KEY` - Your Hack Club AI API key (required)
- `HACKCLUB_AI_API_URL` - API endpoint URL
- `AI_MODEL` - Model to use (default: `google/gemini-3-pro-preview`)
- `TEMPERATURE` - Response randomness (0.0-2.0, default: 0.7)
- `MAX_TOKENS` - Maximum response tokens (default: 4000)
- `TOP_P` - Nucleus sampling (0.0-1.0, default: 1.0)
- `REQUEST_TIMEOUT` - Request timeout in milliseconds (default: 60000)

## Usage

1. Click the extension icon in your toolbar
2. Upload an image and/or enter text to analyze
3. Click "Analyze" to scan for propaganda techniques
4. Review the detailed analysis results

## Files

- `manifest.json` - Extension configuration (Manifest V3)
- `popup.html` - The popup UI
- `popup.css` - Styling for the popup
- `popup.js` - Main extension logic
- `api.js` - Hack Club AI API integration
- `config.example.js` - Example configuration file (copy to `config.js` and add your API key)
- `config.js` - Your local configuration file (gitignored, copy from `config.example.js`)
- `prompt.md` - System prompt for propaganda detection
- `.env` / `.env.example` - Environment variable reference (optional, Chrome extensions use `config.js`)

## Adding Icons

To complete the setup, add icon files to the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can use any image editor to create these, or use placeholder images for testing.

