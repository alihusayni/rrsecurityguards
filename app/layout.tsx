import type { Metadata } from "next";
import { Poppins, Roboto_Slab } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallRailLoader from "@/components/callrail-loader";
import "./globals.css";


const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  // 600 MUST be first — next/font preloads the first weight in the array.
  // Hero H1 uses font-semibold (600). If preload is ever re-enabled,
  // this ensures the correct weight is fetched before the LCP element renders.
  weight: ["600", "400", "300"],
  display: "optional",
  preload: false,
});

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "optional",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Security Guard Services in Orange, CA | Rapid Response Security Guards",
    template: "%s | Rapid Response Security Guards",
  },
  description:
    "Licensed & insured security guard services in Orange and Orange County. Armed and unarmed guards, mobile patrol, fire watch, event security, and construction site security. Get a free quote today.",
  keywords: [
    "security guard services Orange",
    "security company Orange County",
    "armed security guards California",
    "mobile patrol security",
    "fire watch services",
    "construction site security",
    "event security Orange County",
    "PPO 121228",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.rrsecurityguards.com",
    siteName: "Rapid Response Security Guards",
    title: "Security Guard Services in Orange, CA | Rapid Response Security Guards",
    description:
      "Licensed & insured security guard services in Orange and Orange County. Armed and unarmed guards, mobile patrol, fire watch, event security, and construction site security.",
  },
  metadataBase: new URL("https://www.rrsecurityguards.com"),
  // verification: { google: 'YOUR_GSC_TOKEN_HERE' }, // Uncomment and fill when GSC token is available
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${robotoSlab.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20 md:pt-24">{children}</main>
        <Footer />
        <CallRailLoader />
        <Script
          src="https://www.despora.ai/despora-pixel.js"
          data-project="rrsecurityguards"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
