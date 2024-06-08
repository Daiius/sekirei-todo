import type { Metadata } from "next";
import clsx from 'clsx';
import { ThemeProvider } from 'next-themes';
import "./globals.css";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
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
          {children}
        </body>
      </ThemeProvider>
    </html>
  );
}
