'use client';

import { useState } from 'react';
import styles from './ProductReviews.module.css';

interface Review {
    id: string;
    author: string;
    rating: number;
    date: string;
    comment: string;
    likes: number;
    dislikes: number;
    avatar?: string;
}

const mockReviews: Review[] = [
    {
        id: '1',
        author: 'Lila Hawthorne',
        rating: 5,
        date: 'Il y a 1 semaine',
        comment: 'Produit exceptionnel ! La qualité est au rendez-vous et le design est vraiment élégant. Je recommande vivement.',
        likes: 6,
        dislikes: 0,
    },
    {
        id: '2',
        author: 'Sophie Langley',
        rating: 5,
        date: 'Il y a 1 semaine',
        comment: 'Parfait ! La coupe est excellente et le matériau est de très bonne qualité. Un achat que je ne regrette pas.',
        likes: 6,
        dislikes: 0,
    },
    {
        id: '3',
        author: 'Ethan Caldwell',
        rating: 5,
        date: 'Il y a 1 semaine',
        comment: 'Excellent produit, qualité premium. Le design est moderne et s\'adapte parfaitement à mon style.',
        likes: 6,
        dislikes: 0,
    },
    {
        id: '4',
        author: 'Marie Dubois',
        rating: 4,
        date: 'Il y a 2 semaines',
        comment: 'Très bon produit, je suis satisfaite. La livraison était rapide et l\'emballage soigné.',
        likes: 4,
        dislikes: 0,
    },
];

export default function ProductReviews() {
    const [sortBy, setSortBy] = useState('newest');
    const [showWriteReview, setShowWriteReview] = useState(false);

    const averageRating = mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length;
    const totalReviews = mockReviews.length;

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>
                ★
            </span>
        ));
    };

    return (
        <div className={styles.reviewsSection}>
            <div className={styles.reviewsHeader}>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${styles.active}`}>Avis Clients</button>
                    <button className={styles.tab}>Livraison & Retours</button>
                </div>
            </div>

            <div className={styles.ratingSummary}>
                <div className={styles.ratingDisplay}>
                    <div className={styles.ratingNumber}>{averageRating.toFixed(1)}</div>
                    <div className={styles.starsContainer}>
                        {renderStars(Math.round(averageRating))}
                    </div>
                    <div className={styles.reviewsCount}>Basé sur {totalReviews} avis</div>
                </div>
                <button 
                    className={styles.writeReviewBtn}
                    onClick={() => setShowWriteReview(!showWriteReview)}
                >
                    Écrire un avis
                </button>
            </div>

            <div className={styles.sortContainer}>
                <select 
                    className={styles.sortSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="newest">Trier par Plus récent</option>
                    <option value="oldest">Trier par Plus ancien</option>
                    <option value="highest">Note la plus haute</option>
                    <option value="lowest">Note la plus basse</option>
                </select>
            </div>

            <div className={styles.reviewsList}>
                {mockReviews.map((review) => (
                    <div key={review.id} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                            <div className={styles.reviewerInfo}>
                                <div className={styles.avatar}>
                                    {getInitials(review.author)}
                                </div>
                                <div>
                                    <div className={styles.reviewerName}>{review.author}</div>
                                    <div className={styles.reviewDate}>{review.date}</div>
                                </div>
                            </div>
                            <div className={styles.reviewRating}>
                                {renderStars(review.rating)}
                            </div>
                        </div>
                        <p className={styles.reviewComment}>{review.comment}</p>
                        <div className={styles.reviewActions}>
                            <button className={styles.actionBtn}>
                                👍 {review.likes}
                            </button>
                            <button className={styles.actionBtn}>
                                👎 {review.dislikes}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

