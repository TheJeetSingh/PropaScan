# PropaScan - Propaganda Detection Chrome Extension

A Chrome Extension that utilizes Google Gemini 3 Pro Preview to detect propaganda in images and text.

## Installation For Developers

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `extension/` folder (this folder)
5. The extension icon should appear in your Chrome toolbar

## Installation For Regular Users

1. Coming soon to the Chrome Web Store!

## Configuration

You have two options for API access:

### Option 1: Backend Proxy (Recommended - No API Key Needed)

1. Deploy the website to Vercel (see `../website-next/README.md`)
2. Set `HACK_CLUB_AI_API_KEY` in Vercel environment variables
3. Copy the example configuration file:
   ```bash
   cp config.example.js config.js
   ```
   On Windows (PowerShell):
   ```powershell
   Copy-Item config.example.js config.js
   ```
4. Open `config.js` and set your Vercel URL:
   ```javascript
   PROXY_URL: 'https://your-vercel-url.vercel.app',
   ```
5. Leave `HACK_CLUB_AI_API_KEY` empty - the proxy handles authentication

**Benefits:** No API key needed in extension, rate limiting, better security

### Option 2: Direct API Access (Requires API Key)

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
4. Leave `PROXY_URL` empty

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
- `background.js` - Background service worker for API requests
- `config.example.js` - Example configuration file (copy to `config.js` and add your API key)
- `config.js` - Your local configuration file (gitignored, copy from `config.example.js`)

## Adding Icons

To complete the setup, add icon files to the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can use any image editor to create these, or use placeholder images for testing.

## Chrome Web Store Submission

1. Zip the contents of this `extension/` folder (not the folder itself)
2. Submit the zip file to Chrome Web Store
3. Make sure `config.js` is NOT included (it's gitignored)

## Website & Backend

A marketing website and backend API proxy for PropaScan is available in the `../website-next/` directory. See `../website-next/README.md` for deployment instructions.

