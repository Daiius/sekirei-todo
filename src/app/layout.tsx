import type { Metadata } from "next";
import clsx from 'clsx';

import { ThemeProvider } from 'next-themes';

import Header from '@/components/Header';

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
      <ThemeProvider enableSystem attribute='class'>
        <body className={clsx(
          'bg-slate-200 dark:bg-slate-800',
        )}>
          <Header />
          {children}
        </body>
      </ThemeProvider>
    </html>
  );
}

