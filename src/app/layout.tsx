import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'ModelSwitch Lab',
  description:
    'Run reproducible model benchmarks through hosted Otari. Verify answers, compare measured performance, and inspect request evidence.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.mode=localStorage.getItem('msl-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
