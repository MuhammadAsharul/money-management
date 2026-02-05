import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/language-context";
import FloatingControls from '@/components/layout/FloatingControls';
import QueryProvider from '@/lib/query-provider';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MoneyTracker - Financial Management",
  description: "Track your income and expenses with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <QueryProvider>
                <FloatingControls />
                {children}
                <Toaster position="top-center" richColors />
              </QueryProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
