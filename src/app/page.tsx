import Hero from "@/components/ui/Hero";
import FeaturedCategories from "@/components/ui/FeaturedCategories";
import StatsSection from "@/components/ui/StatsSection";
import NewsletterSection from "@/components/ui/NewsletterSection";
import AnimatedSection from "@/components/ui/AnimatedSection";
import HomePageClient from "@/components/HomePageClient";
import { getBestSellingProducts, getFeaturedProductsWithSales } from "@/lib/products-db";
import styles from './page.module.css';

export default async function Home() {
  // Récupérer les meilleures ventes (top 4) depuis la base de données
  // Les produits sont automatiquement triés par nombre de commandes
  const bestSellers = await getBestSellingProducts(4);
  
  // Récupérer les produits vedettes (positions 1 à 5) avec leur quantité vendue
  // Ces produits sont automatiquement les top 5 avec quantité affichée
  const featuredProductsWithSales = await getFeaturedProductsWithSales(5);

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
