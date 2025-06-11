import styles from './layout.module.scss';

export default function PreviewLayout({ children }) {
  return (
    <div className={styles.page}>
      <main className={`${styles.content} AutoHeight`}>
        {children}
      </main>
    </div>
  );
}
