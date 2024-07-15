import type { Metadata } from "next";
import clsx from 'clsx';

import { Session } from 'next-auth';
import type { AppProps } from 'next/app';
import { NextComponentType } from 'next';

import { ThemeProvider } from 'next-themes';
import TrpcProvider from '@/trpc/provider';
import { SessionProvider } from 'next-auth/react';


import Header from '@/components/Header';
import "./globals.css";

export const metadata: Metadata = {
  title: "Sekirei Todo",
  description: "セキレイが尻尾を振るTo-Doアプリ",
};

export default function RootLayout({
  children,
  //session,
}: Readonly<{
  children: React.ReactNode; 
  //session: Session;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <SessionProvider /*session={session}*/>
        <ThemeProvider enableSystem attribute='class'>
          <TrpcProvider>
            <body className={clsx(
              'bg-slate-200 dark:bg-slate-800',
            )}>
              <Header />
              {children}
            </body>
          </TrpcProvider>
        </ThemeProvider>
      </SessionProvider>
    </html>
  );
}

