import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'NuPrego — Controle de Gastos',
  description: 'Sistema pessoal de controle financeiro',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, overflow: 'auto', padding: '32px', minWidth: 0 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
