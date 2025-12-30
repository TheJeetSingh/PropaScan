# PropaScan Website - Next.js Version

Modern Next.js 14 implementation of the PropaScan marketing website with the same vintage newspaper aesthetic.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Framer Motion** for smooth animations
- **CSS Modules** for scoped styling
- **Google Fonts** optimization (EB Garamond, Playfair Display)
- **Responsive Design** - mobile, tablet, desktop
- **Production-ready** with optimized performance

## Getting Started

### Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
website-next/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main page component
│   ├── page.module.css     # Page-specific styles
│   └── globals.css         # Global styles & CSS variables
├── components/
│   ├── Masthead.tsx        # Newspaper header
│   ├── HeroBanner.tsx      # Hero section
│   ├── MainContent.tsx     # Main article content
│   ├── Sidebar.tsx         # Sidebar with CTA, stats, etc.
│   ├── BottomSection.tsx   # Open source info & quote
│   ├── Footer.tsx          # Footer links
│   └── *.module.css        # Component styles
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Design System

### Color Palette

- **Paper**: `#cbae88`, `#b79d7a`, `#d5bea0`, `#e8dcc8`
- **Ink**: `#2c2416`, `#4a3f2f`, `#6b5d4d`
- **Accents**: `#8b2500` (red), `#8b6914` (gold)

### Typography

- **Masthead**: UnifrakturMaguntia (Gothic blackletter)
- **Headlines**: Playfair Display
- **Body**: EB Garamond

### Animations

- Scroll-triggered fade-ins with Framer Motion
- Staggered component reveals
- Smooth hover transitions
- View-based animation triggers

## Key Components

- **Masthead**: Newspaper-style header with dynamic date
- **HeroBanner**: Breaking news headline style
- **MainContent**: Lead story with pull quote, info boxes, features grid
- **Sidebar**: CTA button, stats, techniques list, quick start guide
- **BottomSection**: Open source info with GitHub link
- **Footer**: Navigation links and copyright

## Deployment

### Vercel (Recommended)

```bash
npm run build
```

Deploy to Vercel with one click or via CLI:

```bash
vercel
```

### Other Platforms

The site can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Cloudflare Pages
- Self-hosted with Node.js

## Customization

- **Colors**: Edit CSS variables in `app/globals.css`
- **Content**: Modify component files in `components/`
- **Fonts**: Update `app/layout.tsx` for different Google Fonts
- **Install URL**: Update button in `components/Sidebar.tsx`

## Performance

- Next.js automatic code splitting
- Optimized Google Fonts loading
- Framer Motion with reduced motion support
- Responsive images and lazy loading
- CSS Modules for minimal bundle size

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: iOS Safari, Chrome Mobile

## License

Match the license of the main PropaScan project (MIT).
