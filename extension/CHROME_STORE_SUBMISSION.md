# Chrome Web Store Submission Guide

## Preparing Your Extension

1. **Make sure all files are in the `extension/` folder**
   - All `.js`, `.html`, `.css` files
   - `manifest.json`
   - `icons/` folder with all icon sizes
   - `config.example.js` (NOT `config.js` - that's gitignored)

2. **Remove any development files**
   - No `node_modules/`
   - No `.git/` folder
   - No `config.js` (contains secrets)

## Creating the Zip File

### Windows (PowerShell)
```powershell
# Navigate to extension folder
cd extension

# Create zip (excludes config.js automatically via .gitignore)
Compress-Archive -Path * -DestinationPath ../propascan-extension.zip -Force
```

### Mac/Linux
```bash
# Navigate to extension folder
cd extension

# Create zip (excludes config.js)
zip -r ../propascan-extension.zip . -x "config.js" ".git/*" "*.log"
```

### Manual Method
1. Select all files and folders inside `extension/` folder
2. Right-click → "Send to" → "Compressed (zipped) folder"
3. Name it `propascan-extension.zip`

## What to Include

✅ **Include:**
- manifest.json
- All .js, .html, .css files
- icons/ folder
- config.example.js
- README.md (optional, but helpful)

❌ **Don't Include:**
- config.js (contains API keys)
- .git/ folder
- node_modules/
- .DS_Store, Thumbs.db
- Any .log files

## Submission Checklist

- [ ] Extension loads without errors in Chrome
- [ ] All icons display correctly
- [ ] No console errors
- [ ] config.js is NOT in the zip
- [ ] Zip file is under 10MB (should be fine)
- [ ] manifest.json has correct version number
- [ ] Description in manifest.json is updated

## Upload to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `propascan-extension.zip`
4. Fill out store listing:
   - Screenshots (1280x800 or 640x400)
   - Detailed description
   - Category (Productivity or News & Weather)
   - Privacy policy URL (required!)
5. Submit for review

