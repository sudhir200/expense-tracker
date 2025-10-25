'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import CommandPaletteProvider from "@/components/CommandPaletteProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AppWrapper from "@/components/AppWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="antialiased h-full bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        <AuthProvider>
          <SettingsProvider>
            <AppWrapper>
              <CommandPaletteProvider>
                <div className="min-h-full">
                  <Navigation />
                  <main className="flex-1">
                    {children}
                  </main>
                </div>
              </CommandPaletteProvider>
            </AppWrapper>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
