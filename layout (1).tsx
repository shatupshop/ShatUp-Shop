import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Poppins } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import SplashScreen from "@/components/SplashScreen";
import Analytics from "@/components/Analytics";

// Poppins for English, Hind Siliguri for Bangla (the browser picks the right one per letter)
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins", display: "swap" });
const hind = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-hind", display: "swap" });

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const TITLE = "ShatUp Shop — Shop Smart. Live Better.";
const DESC = "Shop fashion, beauty, home & lifestyle products online in Bangladesh. Order easily on WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE || "http://localhost:3000"),
  title: TITLE,
  description:
    "ShatUp Shop — Shop smart. Live better. Shop fashion, beauty, home & lifestyle products online in Bangladesh.",
  applicationName: "ShatUp Shop",
  openGraph: {
    type: "website",
    siteName: "ShatUp Shop",
    title: TITLE,
    description: DESC,
    locale: "en_BD",
    images: [{ url: "/logo.png", alt: "ShatUp Shop" }]
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: ["/logo.png"] },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B8F67"
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "ShatUp Shop",
  slogan: "Shop Smart. Live Better.",
  areaServed: "BD",
  ...(SITE ? { url: SITE } : {})
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${hind.variable}`}>
      <body className="font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Analytics />
        <SplashScreen />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
