import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LenisProvider from "@/components/General/LenisProvider";
import Footer from "@/components/General/Footer";
import ClientLayout from "@/components/General/ClientLayout";
import UIProvider from "@/components/UI/UIProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Wayfinder",
  description: "Your AI-powered guide to smoother, smarter, and stress-free journeys across Singapore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} flex flex-col w-screen antialiased`}
        >
          <UIProvider>
            <LenisProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </LenisProvider>
          </UIProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
