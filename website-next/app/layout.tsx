import type { Metadata } from 'next'
import { EB_Garamond, Playfair_Display, UnifrakturMaguntia } from 'next/font/google'
import './globals.css'

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const unifraktur = UnifrakturMaguntia({
  subsets: ['latin'],
  variable: '--font-fraktur',
  weight: '400',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PropaScan - Expose Propaganda & Manipulation',
  description: 'Chrome extension that detects propaganda techniques, bias, and manipulation in web content using AI analysis.',
  keywords: ['propaganda', 'bias detection', 'media literacy', 'chrome extension', 'misinformation'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${ebGaramond.variable} ${playfair.variable} ${unifraktur.variable}`}>
      <body>{children}</body>
    </html>
  )
}
