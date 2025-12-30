'use client'

import { motion } from 'framer-motion'
import styles from './HeroBanner.module.css'

export default function HeroBanner() {
  return (
    <motion.article
      className={styles.banner}
      initial={{ opacity: 1, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.kicker}>BREAKING INVESTIGATION</div>
      <h2 className={styles.headline}>
        Propaganda Lurks in Every Corner of the Internet
      </h2>
      <div className={styles.deck}>
        New browser extension arms readers with instant analysis tools to detect bias,
        manipulation, and disinformation before it spreads
      </div>
    </motion.article>
  )
}
