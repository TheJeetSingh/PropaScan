# PropaScan

AI-powered propaganda and manipulation detection Chrome Extension with marketing website and backend proxy.

## Project Structure

```
PropaScan/
├── extension/          # Chrome Extension files (for Chrome Web Store)
│   ├── manifest.json
│   ├── popup.*
│   ├── background.js
│   ├── content.js
│   └── ... (all extension files
│
└── website-next/       # Next.js website + backend API proxy
    ├── app/
    │   └── api/
    │       └── analyze/  # Backend proxy endpoint
    ├── components/
    └── package.json
```

## Quick Start

### For Extension Development

1. Navigate to `extension/` folder
2. See `extension/README.md` for setup instructions
3. Load unpacked extension from `extension/` folder in Chrome

### For Website/Backend Deployment

1. Navigate to `website-next/` folder
2. See `website-next/README.md` for deployment instructions
3. Deploy to Vercel with environment variables set

## Chrome Web Store Submission

Zip the `extension/` folder contents (not the folder itself) and submit to Chrome Web Store.

## Deployment

- **Extension**: Zip `extension/` folder contents → Chrome Web Store
- **Website**: Deploy `website-next/` folder → Vercel

See individual README files in each folder for detailed instructions.
