import Link from 'next/link';
import Image from 'next/image';
import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.imageWrapper}>
                <Image
                    src="/hero-banner.png"
                    alt="Nouvelle Collection Monican"
                    fill
                    className={styles.image}
                    priority
                />
            </div>
            <div className={styles.overlay}></div>

            <div className={styles.content}>
                <div className={styles.textContent}>
                    <h1 className={styles.title}>
                        Style <span className={styles.highlight}>International</span>,<br />
                        Livré chez Vous.
                    </h1>
                    <p className={styles.subtitle}>
                        Découvrez la nouvelle collection de tennis, jeans et accessoires.
                        Qualité premium pour USA, Canada et Mexique.
                    </p>
                    <div className={styles.buttons}>
                        <Link href="/catalog" className="btn btn-primary">
                            Acheter Maintenant
                        </Link>
                        <Link href="/catalog?category=new" className="btn btn-secondary">
                            Nouveautés
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
