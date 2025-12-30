import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.line} />

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.title}>PropaScan</div>
          <div className={styles.text}>Exposing manipulation, one page at a time</div>
        </div>

        <div className={styles.section}>
          <div className={styles.links}>
            <a href="https://github.com/TheJeetSingh/PropaScan" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
            <span className={styles.separator}>●</span>
            <a href="https://github.com/TheJeetSingh/PropaScan" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <span className={styles.separator}>●</span>
            <a href="https://github.com/TheJeetSingh/PropaScan/issues" target="_blank" rel="noopener noreferrer">
              Report Issues
            </a>
          </div>
        </div>
      </div>

      <div className={styles.copyright}>
        © 2024 PropaScan Project • Licensed under MIT
      </div>
    </footer>
  )
}
