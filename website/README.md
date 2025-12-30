# PropaScan Website

Marketing website for the PropaScan Chrome extension, featuring a distinctive vintage newspaper aesthetic that matches the extension's UI design.

## Design Aesthetic

The website uses a **vintage newspaper/old journalism** theme with:

- **Typography**:
  - UnifrakturMaguntia (gothic blackletter) for the masthead
  - Playfair Display for headlines and emphasis
  - EB Garamond for body text

- **Color Palette**:
  - Paper tones: `#cbae88` (base), `#b79d7a` (dark), `#d5bea0` (light), `#e8dcc8` (cream)
  - Ink colors: `#2c2416` (dark), `#4a3f2f` (medium), `#6b5d4d` (light)
  - Accents: `#8b2500` (red), `#8b6914` (gold)

- **Visual Effects**:
  - Torn paper edges
  - Paper grain texture overlay
  - Vintage border decorations
  - Box shadows for layered paper effect
  - Corner folds and crinkle effects
  - Wavy newspaper clipping edges

## Features

- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile
- **Smooth Animations**: Scroll-triggered fade-ins and staggered animations
- **Interactive Elements**:
  - Hover effects on feature cards
  - Animated CTA button with pulse effect
  - Dynamic date display
  - Ink smudge effect following cursor
- **Easter Egg**: Konami code activates vintage print mode
- **Print Friendly**: Optimized for printing

## File Structure

```
website/
├── index.html       # Main HTML structure
├── styles.css       # All styling and animations
├── script.js        # Interactive functionality
└── README.md        # This file
```

## Usage

1. **Local Development**:
   - Simply open `index.html` in a web browser
   - No build process or dependencies required

2. **Deployment**:
   - Upload all files to any static hosting service
   - Compatible with GitHub Pages, Netlify, Vercel, etc.

3. **Customization**:
   - Update the install button URL in `script.js` (line 30)
   - Modify links in footer to point to actual documentation/GitHub
   - Adjust color variables in `styles.css` `:root` section

## Key Sections

- **Masthead**: Newspaper-style header with PropaScan branding
- **Hero Banner**: Eye-catching headline about internet propaganda
- **Main Content**: Detailed explanation of features and functionality
- **Features Grid**: 6 key features with icons and descriptions
- **Sidebar**:
  - CTA box with install button
  - Statistics display
  - Detected techniques list
  - Quick start guide
- **Open Source Notice**: Information about transparency and privacy
- **Footer**: Links and copyright information

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Performance

- No external dependencies beyond Google Fonts
- Lightweight: ~50KB total (uncompressed)
- Fast initial load with progressive enhancement
- CSS animations use GPU acceleration

## Future Enhancements

Potential additions:
- Demo video or screenshots of the extension in action
- User testimonials section
- Blog/news section for updates
- Interactive demo of propaganda detection
- Chrome Web Store statistics integration
- Multi-language support

## License

Match the license of the main PropaScan project (MIT suggested).
