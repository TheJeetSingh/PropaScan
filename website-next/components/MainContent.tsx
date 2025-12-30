'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import styles from './MainContent.module.css'

const features = [
  { icon: '🔍', title: 'Instant Analysis', desc: 'Scan entire pages or selected regions with one click' },
  { icon: '🎯', title: 'Technique Detection', desc: 'Identifies 20+ propaganda methods and cognitive biases' },
  { icon: '📊', title: 'Severity Scoring', desc: '5-tier rating system from neutral to disinformation' },
  { icon: '✏️', title: 'Neutral Rewrites', desc: 'See how biased content looks when presented fairly' },
  { icon: '💡', title: 'Highlight Mode', desc: 'Visual markers show manipulation directly on pages' },
  { icon: '📚', title: 'Analysis History', desc: 'Track and review all scanned content over time' },
]

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      className={styles.featureCard}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.featureIcon}>{feature.icon}</div>
      <div className={styles.featureTitle}>{feature.title}</div>
      <div className={styles.featureDesc}>{feature.desc}</div>
    </motion.div>
  )
}

export default function MainContent() {
  return (
    <>
      {/* Lead Story */}
      <article className={`${styles.story} ${styles.leadStory}`}>
        <h3 className={styles.headline}>What Is PropaScan?</h3>
        <div className={styles.byline}>By The PropaScan Team</div>

        <p className={styles.text}>
          In an era where misinformation spreads faster than truth, PropaScan serves as your
          personal watchdog against manipulation. This powerful Chrome extension analyzes web
          pages in real-time, detecting propaganda techniques, emotional manipulation, and
          cognitive biases hidden in plain sight.
        </p>

        <div className={styles.pullQuote}>
          <div className={styles.quoteMark}>"</div>
          <div className={styles.quoteText}>
            Not all manipulation is obvious. PropaScan reveals what they don't want you to see.
          </div>
          <div className={`${styles.quoteMark} ${styles.quoteFlip}`}>"</div>
        </div>

        <p className={styles.text}>
          Using advanced AI analysis, PropaScan examines text and images across any webpage,
          identifying subtle tactics used to sway opinion, trigger emotions, and bypass critical
          thinking. Each scan produces a detailed report with severity ratings, technique
          breakdowns, and neutral rewrites of biased content.
        </p>

        <h4 className={styles.subheading}>How It Works</h4>
        <p className={styles.text}>
          PropaScan operates in two powerful modes: <strong>Patrol Mode</strong> for instant
          page-wide scans, and <strong>Capture Mode</strong> for analyzing specific text or
          screenshot selections. Results are categorized across five propaganda tiers—from neutral
          reporting (Tier 1) to outright disinformation (Tier 5).
        </p>

        <div className={styles.infoBox}>
          <div className={styles.infoBoxHeader}>THE FIVE TIERS OF PROPAGANDA</div>
          <ul className={styles.tierList}>
            <li><span className={`${styles.tierMarker} ${styles.tier1}`}>Tier 1</span> Neutral & Factual</li>
            <li><span className={`${styles.tierMarker} ${styles.tier2}`}>Tier 2</span> Mild Bias Present</li>
            <li><span className={`${styles.tierMarker} ${styles.tier3}`}>Tier 3</span> Partisan Slant</li>
            <li><span className={`${styles.tierMarker} ${styles.tier4}`}>Tier 4</span> Heavy Manipulation</li>
            <li><span className={`${styles.tierMarker} ${styles.tier5}`}>Tier 5</span> Active Disinformation</li>
          </ul>
        </div>

        <p className={styles.text}>
          Every analysis identifies specific propaganda techniques—from loaded language and false
          equivalence to appeal to fear and bandwagon effects. PropaScan doesn't just flag
          problems; it educates users on how manipulation works.
        </p>
      </article>

      {/* Features */}
      <article className={styles.story}>
        <h3 className={styles.headline}>Key Features</h3>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </article>
    </>
  )
}
