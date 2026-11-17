import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgroGuard | Crop Disease Monitoring & Electrical Control',
  description:
    'HBTU Kanpur B.Tech Electrical Engineering Final Year Project & UPCST 2026-2027 Grant Prototype — Real-time IoT telemetry, CNN leaf diagnostics, and automated mitigation control.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#09090b] text-zinc-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
