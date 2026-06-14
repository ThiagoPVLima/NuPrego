import Link from 'next/link';
import DemoProvider from '@/contexts/DemoContext';
import DemoSidebar from '@/components/organisms/DemoSidebar';
import styles from './demo.module.css';

export const metadata = {
  title: 'NuPrego — Modo Demo',
  description: 'Explore o NuPrego com dados fictícios. Nada é salvo.',
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <div className={styles.shell}>
        <div className={styles.banner}>
          <span className={styles.bannerTag}>DEMO</span>
          <span className={styles.bannerText}>Dados fictícios · Nada é salvo</span>
          <Link href="/login" className={styles.bannerLink}>Fazer login real →</Link>
        </div>

        <div className={styles.body}>
          <DemoSidebar />
          <div className={styles.content}>
            {children}
          </div>
        </div>
      </div>
    </DemoProvider>
  );
}
