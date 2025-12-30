'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import styles from './BottomSection.module.css'

export default function BottomSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className={styles.bottom}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1.2, delay: 0.7 }}
    >
      {/* Open Source Notice */}
      <article className={styles.opensource}>
        <h3 className={styles.headline}>Open Source & Privacy-Focused</h3>
        <p className={styles.text}>
          PropaScan is completely free and open source. The code is available on GitHub for
          inspection, contribution, and adaptation. We believe transparency is essential for a
          tool designed to expose manipulation—so we practice what we preach.
        </p>
        <p className={styles.text}>
          Your privacy matters. PropaScan analyzes content locally when possible and does not
          track your browsing history. All analysis results are stored locally on your device,
          never sent to external servers without your explicit action.
        </p>
        <div className={styles.githubLink}>
          <a href="https://github.com/TheJeetSingh/PropaScan" className={styles.linkButton} target="_blank" rel="noopener noreferrer">
            View on GitHub →
          </a>
        </div>
      </article>

      {/* Footer Banner */}
      <div className={styles.footerBanner}>
        <div className={styles.bannerText}>
          "The best way to control people is to control the information they receive."
        </div>
        <div className={styles.bannerAttribution}>— Fight back with PropaScan</div>
      </div>
    </motion.div>
  )
}
