import type { Metadata } from "next";
import clsx from 'clsx';

import { ThemeProvider } from 'next-themes';

import Header from '@/components/Header';

import "./globals.css";

export const metadata: Metadata = {
  title: "Sekirei Todo",
  description: "セキレイが尻尾を振るTo-Doアプリ",
  openGraph: {
    type: 'website',
    url: 'https://sekirei-todo.faveo-systema.net',
    siteName: 'Sekirei Todo',
    images: 'https://sekirei-todo.faveo-systema.net/ogimage.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; 
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(
        'bg-slate-200 dark:bg-slate-800 flex flex-col',
        'min-h-screen',
      )}>
        <ThemeProvider defaultTheme='light' attribute='class'>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

