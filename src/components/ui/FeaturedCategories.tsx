import Link from 'next/link';
import Image from 'next/image';
import styles from './FeaturedCategories.module.css';

const categories = [
    { name: 'Tennis', slug: 'tennis', image: '/cat-tennis.jpg' }, // Placeholder images needed
    { name: 'Chemises', slug: 'chemises', image: '/cat-shirts.jpg' },
    { name: 'Jeans', slug: 'jeans', image: '/cat-jeans.jpg' },
    { name: 'Maillots', slug: 'maillots', image: '/cat-jerseys.jpg' },
];

export default function FeaturedCategories() {
    return (
        <section className={styles.section}>
            <div className="container">
                <h2 className={styles.title}>Nos Catégories</h2>
                <div className={styles.grid}>
                    {categories.map((cat) => (
                        <Link key={cat.slug} href={`/catalog?category=${cat.slug}`} className={styles.card}>
                            {/* Using a colored placeholder div for now if image fails, or Next.js Image with fallback */}
                            <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#e5e7eb' }}></div>
                            <div className={styles.cardOverlay}></div>
                            <span className={styles.cardTitle}>{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
