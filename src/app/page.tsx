export const dynamic = 'force-dynamic';

import Hero from "@/components/ui/Hero";
import FeaturedCategories from "@/components/ui/FeaturedCategories";
import StatsSection from "@/components/ui/StatsSection";
import NewsletterSection from "@/components/ui/NewsletterSection";
import AnimatedSection from "@/components/ui/AnimatedSection";
import HomePageClient from "@/components/HomePageClient";
import { getBestSellingProducts, getFeaturedProductsWithSales } from "@/lib/products-db";
import { Product } from "@/lib/types";
import styles from "./page.module.css";

export default async function Home() {
  // Meilleures ventes (top 4)
  let bestSellers: Product[] = [];
  try {
    bestSellers = await getBestSellingProducts(4);
  } catch (error) {
    console.error("Error fetching best sellers:", error);
    bestSellers = [];
  }

  // Produits vedettes avec quantité vendue (top 5)
  let featuredProductsWithSales: Array<Product & { salesCount: number }> = [];
  try {
    featuredProductsWithSales = await getFeaturedProductsWithSales(5);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    featuredProductsWithSales = [];
  }

  return (
    <main className={styles.homePage}>
      <Hero />

      <AnimatedSection direction="up" delay={200}>
        <FeaturedCategories />
      </AnimatedSection>

      <StatsSection />

      <HomePageClient
        bestSellers={bestSellers}
        featuredProductsWithSales={featuredProductsWithSales}
      />

      <NewsletterSection />
    </main>
  );
}
