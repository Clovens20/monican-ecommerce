import { mockProducts } from '@/lib/products';
import ProductCard from '@/components/product/ProductCard';
import styles from './page.module.css';

export default function CatalogPage() {
    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Catalogue</h1>
                <select className={styles.sortSelect}>
                    <option value="newest">Nouveautés</option>
                    <option value="price-asc">Prix: Croissant</option>
                    <option value="price-desc">Prix: Décroissant</option>
                </select>
            </div>

            <div className={styles.layout}>
                <aside className={styles.filters}>
                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Catégories</h3>
                        <ul className={styles.filterList}>
                            <li className={styles.filterItem}>Tennis</li>
                            <li className={styles.filterItem}>Chemises</li>
                            <li className={styles.filterItem}>Jeans</li>
                            <li className={styles.filterItem}>Maillots</li>
                        </ul>
                    </div>
                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Taille</h3>
                        <ul className={styles.filterList}>
                            <li className={styles.filterItem}>S</li>
                            <li className={styles.filterItem}>M</li>
                            <li className={styles.filterItem}>L</li>
                            <li className={styles.filterItem}>XL</li>
                        </ul>
                    </div>
                </aside>

                <div className={styles.grid}>
                    {mockProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                    {/* Duplicate for demo purposes to fill grid */}
                    {mockProducts.map((product) => (
                        <ProductCard key={`${product.id}-dup`} product={{ ...product, id: `${product.id}-dup` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
