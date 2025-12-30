import Masthead from '@/components/Masthead'
import HeroBanner from '@/components/HeroBanner'
import MainContent from '@/components/MainContent'
import Sidebar from '@/components/Sidebar'
import BottomSection from '@/components/BottomSection'
import Footer from '@/components/Footer'
import styles from './page.module.css'

export default function Home() {
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
