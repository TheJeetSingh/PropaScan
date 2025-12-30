// Configuration for PropaScan Extension
// IMPORTANT: Copy this file to config.js and update with your API key
// Chrome extensions can't read .env files directly, so update this file manually
//
// Copy this file: cp config.example.js config.js
// Then edit config.js and add your API key

const CONFIG = {
  // OPTION 1: Use backend proxy (recommended - no API key needed)
  // Set this to your deployed Vercel URL (e.g., 'https://propascan.vercel.app')
  // Leave empty to use direct Hack Club AI API (requires API key below)
  PROXY_URL: '',
  
  // OPTION 2: Direct Hack Club AI API (requires API key)
  // REQUIRED if PROXY_URL is empty: Your Hack Club AI API Key
  // Get your API key from: https://hackclub.com/ai
  // IMPORTANT: Replace 'your_api_key_here' with your actual API key
  HACK_CLUB_AI_API_KEY: 'your_api_key_here',
  
  // API Endpoint (only used if PROXY_URL is empty)
  // Hack Club AI uses OpenRouter-compatible API
  // Base URL from documentation: https://ai.hackclub.com/proxy/v1
  // Full endpoint: https://ai.hackclub.com/proxy/v1/chat/completions
  HACKCLUB_AI_API_URL: 'https://ai.hackclub.com/proxy/v1/chat/completions',
  
  // AI Model to use
  AI_MODEL: 'google/gemini-3-pro-preview',
  
  // Request Parameters
  TEMPERATURE: 0.7,           // Controls randomness (0.0 to 2.0)
  MAX_TOKENS: 16000,          // Maximum tokens in response (increased for comprehensive analysis)
  TOP_P: 1.0,                 // Nucleus sampling parameter (0.0 to 1.0)
  
  // Request Timeout (milliseconds)
  REQUEST_TIMEOUT: 60000,     // 60 seconds
  
  // Optional: Hack Club Search API Key (for future search features)
  HACK_CLUB_SEARCH_API_KEY: ''
};

// Make config available globally
window.PropaScanConfig = CONFIG;

