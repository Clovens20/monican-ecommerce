import Hero from "@/components/ui/Hero";
import FeaturedCategories from "@/components/ui/FeaturedCategories";
import StatsSection from "@/components/ui/StatsSection";
import NewsletterSection from "@/components/ui/NewsletterSection";
import AnimatedSection from "@/components/ui/AnimatedSection";
import HomePageClient from "@/components/HomePageClient";
import { getBestSellingProducts, getFeaturedProductsWithSales } from "@/lib/products-db";
import { Product } from "@/lib/types";
import styles from './page.module.css';

export default async function Home() {
  // Récupérer les meilleures ventes (top 4) depuis la base de données
  // Les produits sont automatiquement triés par nombre de commandes
  // Gestion d'erreur pour éviter l'échec du build si Supabase n'est pas configuré
  let bestSellers: Product[] = [];
  try {
    bestSellers = await getBestSellingProducts(4);
  } catch (error) {
    console.error('Error fetching best sellers during build:', error);
    // Continuer avec un tableau vide pour ne pas faire échouer le build
  }
  
  // Récupérer les produits vedettes (positions 1 à 5) avec leur quantité vendue
  // Ces produits sont automatiquement les top 5 avec quantité affichée
  let featuredProductsWithSales: Array<Product & { salesCount: number }> = [];
  try {
    featuredProductsWithSales = await getFeaturedProductsWithSales(5);
  } catch (error) {
    console.error('Error fetching featured products during build:', error);
    // Continuer avec un tableau vide pour ne pas faire échouer le build
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
