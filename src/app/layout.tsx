import type { Metadata } from "next";
import clsx from 'clsx';

import { ThemeProvider } from 'next-themes';
import TrpcProvider from '@/trpc/provider';
import SessionProvider from '@/providers/SessionProvier';

import "./globals.css";

export const metadata: Metadata = {
  title: "Sekirei Todo",
  description: "セキレイが尻尾を振るTo-Doアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; 
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <SessionProvider>
        <ThemeProvider enableSystem attribute='class'>
          <TrpcProvider>
            <body className={clsx(
              'bg-slate-200 dark:bg-slate-800',
            )}>
              {children}
            </body>
          </TrpcProvider>
        </ThemeProvider>
      </SessionProvider>
    </html>
  );
}

