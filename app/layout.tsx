import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ScrollProvider } from "@/components/ScrollContext";
import "./globals.css";
import Navbar from "@/components/Navbar";
import LogoLoader from "@/components/Logoloader";
import { Merriweather } from "next/font/google";
import Providers from "./providers";
// import LenisProvider from "@/components/LenisProvider";

const merriweather = Merriweather({
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-merriweather",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biserica Foișor",
  description: "Biserica Foișor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${merriweather.variable} ${geistSans.variable} ${geistMono.variable} antialiased max-w-screen overflow-x-hidden scroll-smooth`}
      >
        {/* <LenisProvider> */}
        <Providers>
          <ScrollProvider>
            <LogoLoader>
              <main>
                <Navbar />
              </main>
              {children}
            </LogoLoader>
          </ScrollProvider>
        </Providers>
        {/* </LenisProvider> */}
      </body>
    </html>
  );
}
