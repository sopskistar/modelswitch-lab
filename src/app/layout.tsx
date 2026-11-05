import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000',
  ),
  title: 'ModelSwitch Lab',
  description:
    'Test open-weight models against known answers, compare reliability, speed and cost, then switch ModelSwitch Lab test requests through hosted Mozilla Otari.',
  icons: {
    icon: '/modelswitch-icon.png',
    apple: '/modelswitch-icon.png',
  },
  openGraph: {
    title: 'ModelSwitch Lab',
    description: 'Test, compare and switch open-weight models using real hosted Otari requests.',
    images: [
      {
        url: '/modelswitch-icon.png',
        width: 1024,
        height: 1024,
        alt: 'ModelSwitch Lab mark',
      },
    ],
  },
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
