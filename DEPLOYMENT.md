# PropaScan Deployment Guide

## 🚀 Quick Deployment Steps

### Step 1: Deploy Backend to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Navigate to website folder**:
   ```bash
   cd website-next
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   - Follow prompts (use defaults)
   - Note your deployment URL (e.g., `https://propascan.vercel.app`)

5. **Set Environment Variable**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add:
     - **Name**: `HACK_CLUB_AI_API_KEY`
     - **Value**: `sk-hc-v1-b10401d7eab74c13b50d6f97529826217547be71971f47d595d9a99bf9651348`
     - **Environment**: Production, Preview, Development (check all)
   - Click **Save**

6. **Redeploy** (to apply env var):
   ```bash
   vercel --prod
   ```

### Step 2: Update Extension Config

1. **Edit `extension/config.js`**:
   ```javascript
   PROXY_URL: 'https://your-vercel-url.vercel.app',
   ```
   Replace `your-vercel-url` with your actual Vercel URL

2. **Reload extension** in Chrome (`chrome://extensions/` → reload)

### Step 3: Test

1. Open any website
2. Click extension icon
3. Trigger a scan
4. Check that requests go to your Vercel URL
5. Verify analysis works

## 📦 For Chrome Web Store Submission

1. **Update `extension/config.example.js`**:
   ```javascript
   PROXY_URL: 'https://your-vercel-url.vercel.app',
   ```

2. **Zip extension folder**:
   ```powershell
   cd extension
   Compress-Archive -Path * -DestinationPath ../propascan-extension.zip
   ```

3. **Verify zip contains**:
   - ✅ All .js, .html, .css files
   - ✅ manifest.json
   - ✅ icons/ folder
   - ✅ config.example.js
   - ❌ NO config.js (gitignored)

4. **Submit to Chrome Web Store**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Upload `propascan-extension.zip`

## 🔒 Security Checklist

- ✅ API key is in Vercel environment variables (not in code)
- ✅ `config.js` is gitignored
- ✅ `.env.local` is gitignored
- ✅ Extension uses proxy (no API key in extension)
- ✅ Users can set their own PROXY_URL in config.js

## 🌐 Production URLs

After deployment, update these:
- Extension `config.js`: `PROXY_URL: 'https://your-app.vercel.app'`
- Chrome Web Store listing: Link to your Vercel site
- Privacy policy: Host on your Vercel site

## 🐛 Troubleshooting

**404 Error:**
- Check Vercel deployment is live
- Verify API route exists at `/api/analyze`
- Check Vercel function logs

**401/403 Error:**
- Verify `HACK_CLUB_AI_API_KEY` is set in Vercel
- Redeploy after adding env var

**CORS Error:**
- Check CORS headers in API route
- Verify extension origin is allowed

