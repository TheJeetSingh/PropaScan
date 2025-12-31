# PropaScan Website

Marketing website for PropaScan Chrome Extension. Built with Next.js 14.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```bash
# Create .env.local file
echo "HACK_CLUB_AI_API_KEY=your_api_key_here" > .env.local
# Or manually create the file and add:
# HACK_CLUB_AI_API_KEY=your_actual_api_key_here
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
- Hides your API key from the extension (stored in Vercel environment variables)
- Handles CORS for the extension
- Works with Vercel's serverless architecture
- Rate limiting is handled by Hack Club AI API itself

**Serverless Compatible:** The proxy is designed for Vercel's serverless functions:
- Stateless (no in-memory storage)
- Handles CORS per-request
- Environment variables via Vercel dashboard
- Request/response forwarding

Once deployed, update your extension's `config.js` with:
```javascript
PROXY_URL: 'https://your-vercel-url.vercel.app'
```

For local testing, see `../TEST_BACKEND.md` in the root directory.
