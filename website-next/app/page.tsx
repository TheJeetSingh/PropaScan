'use client'

import { useEffect } from 'react'
import Masthead from '@/components/Masthead'
import HeroBanner from '@/components/HeroBanner'
import MainContent from '@/components/MainContent'
import Sidebar from '@/components/Sidebar'
import BottomSection from '@/components/BottomSection'
import Footer from '@/components/Footer'
import styles from './page.module.css'

export default function Home() {
  useEffect(() => {
    console.log('%c📰 PropaScan Website Loaded', 'font-size: 20px; font-weight: bold; color: #8b2500;')
    console.log('%cExposing propaganda, one page at a time', 'font-style: italic; color: #4a3f2f;')
  }, [])

  return (
    <>
      <div className="page-fold" />

      <div className="newspaper">
        <Masthead />

        <main className={styles.content}>
          <HeroBanner />

          <div className={styles.columns}>
            <div className={styles.columnMain}>
              <MainContent />
            </div>

            <aside className={styles.columnSidebar}>
              <Sidebar />
            </aside>
          </div>

          <BottomSection />
        </main>

        <Footer />
      </div>
    </>
  )
}
