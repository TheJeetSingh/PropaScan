'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import styles from './Masthead.module.css'

export default function Masthead() {
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    setCurrentDate(date)
  }, [])

  return (
    <header className={styles.masthead}>
      <div className={styles.ornament}>⚘ ⚘ ⚘</div>

      <div className={styles.editionInfo}>
        <span className={styles.label}>Chrome Extension</span>
        <span className={styles.separator}>●</span>
        <span className={styles.label}>Free & Open Source</span>
      </div>

      <motion.h1
        className={styles.title}
        initial={{ opacity: 1, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
      >
        PropaScan
      </motion.h1>

      <div className={styles.tagline}>The Truth Detector for the Modern Web</div>

      <div className={styles.line} />

      <div className={styles.publishInfo}>
        <span>Exposing Manipulation Since 2024</span>
        <span className={styles.separator}>●</span>
        <span>{currentDate}</span>
      </div>
    </header>
  )
}
