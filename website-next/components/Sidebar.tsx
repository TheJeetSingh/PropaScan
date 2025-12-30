'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import styles from './Sidebar.module.css'

const techniques = [
  'Appeal to Fear',
  'Loaded Language',
  'False Equivalence',
  'Cherry Picking',
  'Bandwagon Effect',
  'Straw Man Arguments',
  'Ad Hominem Attacks',
  'Emotional Manipulation',
  'Glittering Generalities',
  'Red Herring Distractions',
]

function SidebarBox({ children, index }: { children: React.ReactNode, index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 1, x: 12 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 1, x: 12 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function Sidebar() {
  const [buttonText, setButtonText] = useState('Add to Chrome')

  const handleInstall = () => {
    setButtonText('Coming Soon!')
    setTimeout(() => setButtonText('Add to Chrome'), 2000)
  }

  return (
    <>
      {/* CTA Box */}
      <SidebarBox index={0}>
        <div className={`${styles.box} ${styles.ctaBox}`}>
          <div className={styles.ctaHeader}>GET PROPASCAN</div>
          <div className={styles.ctaContent}>
            <p className={styles.ctaText}>
              Install the free Chrome extension and start detecting propaganda today
            </p>
            <button className={styles.ctaButton} onClick={handleInstall}>
              <span className={styles.ctaButtonText}>{buttonText}</span>
              <span className={styles.ctaButtonArrow}>→</span>
            </button>
            <div className={styles.ctaNote}>Free • Open Source • Privacy-First</div>
          </div>
        </div>
      </SidebarBox>

      {/* Stats Box */}
      <SidebarBox index={1}>
        <div className={`${styles.box} ${styles.statsBox}`}>
          <div className={styles.statsHeader}>BY THE NUMBERS</div>
          <div className={styles.statRow}>
            <div className={styles.statNumber}>20+</div>
            <div className={styles.statLabel}>Propaganda Techniques Detected</div>
          </div>
          <div className={styles.statRow}>
            <div className={styles.statNumber}>5</div>
            <div className={styles.statLabel}>Severity Tiers</div>
          </div>
          <div className={styles.statRow}>
            <div className={styles.statNumber}>100%</div>
            <div className={styles.statLabel}>Free & Open Source</div>
          </div>
        </div>
      </SidebarBox>

      {/* Techniques Box */}
      <SidebarBox index={2}>
        <div className={`${styles.box} ${styles.techniquesBox}`}>
          <div className={styles.techniquesHeader}>DETECTED TECHNIQUES</div>
          <ul className={styles.techniquesList}>
            {techniques.map((technique, i) => (
              <li key={i}>{technique}</li>
            ))}
          </ul>
          <div className={styles.techniquesFooter}>+ Many More</div>
        </div>
      </SidebarBox>

      {/* Guide Box */}
      <SidebarBox index={3}>
        <div className={`${styles.box} ${styles.guideBox}`}>
          <div className={styles.guideHeader}>QUICK START</div>
          <ol className={styles.guideSteps}>
            <li>Install the extension</li>
            <li>Navigate to any webpage</li>
            <li>Click the PropaScan icon</li>
            <li>Choose Scan or Capture mode</li>
            <li>Review detailed analysis</li>
          </ol>
        </div>
      </SidebarBox>
    </>
  )
}
