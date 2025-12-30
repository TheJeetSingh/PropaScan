# PropaScan Website

Marketing website for PropaScan Chrome Extension. Built with Next.js 14.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (copy from `.env.local.example`):
```bash
cp .env.local.example .env.local
# Then edit .env.local and add your API key
```

3. Run development server:
```bash
npm run dev
```

4. Deploy to Vercel:
```bash
vercel
```

## Environment Variables

### Required (for API proxy)

- `HACK_CLUB_AI_API_KEY` - Your Hack Club AI API key (get from https://hackclub.com/ai)

Set this in Vercel dashboard: Settings → Environment Variables

## API Proxy

The website includes a backend proxy at `/api/analyze` that:
- Forwards requests to Hack Club AI
- Hides your API key from the extension
- Rate limits requests (20 per hour per IP)
- Handles CORS for the extension

Once deployed, update your extension's `config.js` with:
```javascript
PROXY_URL: 'https://your-vercel-url.vercel.app'
```
