import Hero from "@/components/ui/Hero";
import FeaturedCategories from "@/components/ui/FeaturedCategories";
import ProductCard from "@/components/product/ProductCard";
import { mockProducts } from "@/lib/products";

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedCategories />

      <section className="container" style={{ padding: "4rem 0" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "2rem", textAlign: "center" }}>Meilleures Ventes</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem"
        }}>
          {mockProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
