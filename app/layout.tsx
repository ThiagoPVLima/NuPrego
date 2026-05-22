import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'NuPrego — Controle de Gastos',
  description: 'Sistema pessoal de controle financeiro',
  metadataBase: new URL('https://nu-prego.vercel.app'),
  icons: {
    icon: '/NuPrego-Logo-Ico.ico',
    apple: '/NuPrego-Logo.png',
  },
  openGraph: {
    title: 'NuPrego — Controle de Gastos',
    description: 'Sistema pessoal de controle financeiro',
    url: 'https://nu-prego.vercel.app',
    siteName: 'NuPrego',
    images: [
      {
        url: '/NuPrego-Logo.png',
        width: 512,
        height: 512,
        alt: 'NuPrego Logo',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="pt-BR" className="dark">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {user && (
            <Sidebar
              userName={user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? ''}
            />
          )}
          <main className={`main-content${user ? ' with-sidebar' : ''}`}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
