import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monican | E-commerce Multi-pays",
  description: "Vêtements et accessoires de qualité pour USA, Canada et Mexique.",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: [
      { url: '/logo.png', type: 'image/png' },
    ],
  },
};

import ConditionalHeader from "@/components/layout/ConditionalHeader";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import PromotionBanner from "@/components/promotions/PromotionBanner";
import AbandonedCartPopup from "@/components/cart/AbandonedCartPopup";
import { CartProvider } from "@/lib/cart";
import { CountryProvider } from "@/lib/country";
import { WishlistProvider } from "@/lib/wishlist";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable}`}>
        <LanguageProvider>
          <CountryProvider>
            <CartProvider>
              <WishlistProvider>
                <PromotionBanner />
                <ConditionalHeader />
                <main>{children}</main>
                <ConditionalFooter />
                <AbandonedCartPopup />
              </WishlistProvider>
            </CartProvider>
          </CountryProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
