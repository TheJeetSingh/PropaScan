import styles from '../page.module.css'

export default function PrivacyPolicy() {
  return (
    <div className="newspaper">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', marginBottom: '30px', textAlign: 'center' }}>
          Privacy Policy
        </h1>
        
        <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '18px', lineHeight: '1.8', color: '#2c2416' }}>
          <p style={{ marginBottom: '20px', fontStyle: 'italic' }}>Last updated: December 30, 2024</p>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '20px' }}>
              Overview
            </h2>
            <p>
              PropaScan is committed to protecting your privacy. This extension analyzes web page content 
              locally on your device and does not collect, store, or transmit personal information without 
              your explicit consent.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '20px' }}>
              Data Collection
            </h2>
            <p><strong>We do NOT collect:</strong></p>
            <ul style={{ marginLeft: '30px', marginBottom: '20px' }}>
              <li>Your browsing history</li>
              <li>Personal information</li>
              <li>Search queries</li>
              <li>Location data</li>
              <li>Any identifying information</li>
            </ul>
            <p>
              All analysis results are stored locally on your device using Chrome's storage API. 
              No data is sent to external servers except when you explicitly trigger an analysis, 
              and only the content you choose to analyze is sent.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '20px' }}>
              API Usage
            </h2>
            <p>
              When you use PropaScan to analyze content, the text and/or images you select are sent to 
              an AI service (Hack Club AI / Google Gemini) for analysis. This is the only external 
              data transmission, and it only occurs when you explicitly click "Analyze" or trigger a scan.
            </p>
            <p>
              If you configure the extension to use a backend proxy, your API key is stored locally 
              in your browser's storage and is never transmitted to us or any third party except the 
              AI service provider.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '20px' }}>
              Local Storage
            </h2>
            <p>
              The extension stores the following data locally on your device:
            </p>
            <ul style={{ marginLeft: '30px', marginBottom: '20px' }}>
              <li>Analysis history (URLs, scores, results)</li>
              <li>Extension settings and preferences</li>
              <li>Cached analysis results (to avoid re-analyzing the same content)</li>
            </ul>
            <p>
              All of this data remains on your device and can be cleared at any time through the 
              extension's settings page.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '20px' }}>
              Third-Party Services
            </h2>
            <p>
              PropaScan uses the following third-party services:
            </p>
            <ul style={{ marginLeft: '30px', marginBottom: '20px' }}>
              <li><strong>Hack Club AI / Google Gemini:</strong> For content analysis (only when you trigger a scan)</li>
              <li><strong>Vercel:</strong> For hosting the backend proxy (if configured)</li>
            </ul>
            <p>
              We do not share your data with any third parties except as necessary to provide the 
              analysis service you request.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '20px' }}>
              Open Source
            </h2>
            <p>
              PropaScan is open source. You can inspect the code on GitHub to verify our privacy 
              practices. The source code is available at: 
              <a href="https://github.com/TheJeetSingh/PropaScan" target="_blank" rel="noopener noreferrer" 
                 style={{ color: '#8b2500', textDecoration: 'underline' }}>
                github.com/TheJeetSingh/PropaScan
              </a>
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '20px' }}>
              Contact
            </h2>
            <p>
              If you have questions about this privacy policy, please open an issue on our 
              <a href="https://github.com/TheJeetSingh/PropaScan/issues" target="_blank" rel="noopener noreferrer"
                 style={{ color: '#8b2500', textDecoration: 'underline' }}>
                GitHub repository
              </a>.
            </p>
          </section>

          <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #4a3f2f', textAlign: 'center', fontStyle: 'italic', color: '#6b5d4d' }}>
            <p>PropaScan - Exposing manipulation, one page at a time</p>
            <p style={{ marginTop: '10px' }}>
              <a href="/" style={{ color: '#8b2500', textDecoration: 'underline' }}>← Back to Home</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

