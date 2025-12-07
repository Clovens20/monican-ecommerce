'use client';

import { useState, useEffect } from 'react';
import styles from './ProductReviews.module.css';

interface Review {
    id: string;
    author_name: string;
    rating: number;
    created_at: string;
    comment: string;
    likes: number;
    dislikes: number;
}

interface ProductReviewsProps {
    productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [sortBy, setSortBy] = useState('newest');
    const [showWriteReview, setShowWriteReview] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Formulaire d'avis
    const [formData, setFormData] = useState({
        authorName: '',
        authorEmail: '',
        rating: 5,
        comment: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Charger les avis
    useEffect(() => {
        async function fetchReviews() {
            try {
                setLoading(true);
                const response = await fetch(`/api/products/${productId}/reviews?sortBy=${sortBy}`);
                if (response.ok) {
                    const data = await response.json();
                    setReviews(data.reviews || []);
                    setAverageRating(data.averageRating || 0);
                    setTotalReviews(data.totalReviews || 0);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchReviews();
    }, [productId, sortBy]);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Il y a 1 jour';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
        if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
        return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>
                ★
            </span>
        ));
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch(`/api/products/${productId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // Recharger les avis
                const data = await response.json();
                setReviews([data.review, ...reviews]);
                setTotalReviews(totalReviews + 1);
                setShowWriteReview(false);
                setFormData({ authorName: '', authorEmail: '', rating: 5, comment: '' });
                alert('Votre avis a été publié avec succès !');
            } else {
                const error = await response.json();
                alert(error.error || 'Erreur lors de la publication de l\'avis');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Erreur lors de la publication de l\'avis');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.reviewsSection}>
            {/* Supprimer complètement la section reviewsHeader avec les tabs */}
            {/* <div className={styles.reviewsHeader}>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${styles.active}`}>Avis Clients</button>
                    <button className={styles.tab}>Livraison & Retours</button>
                </div>
            </div> */}

            {/* Titre de la section */}
            <h2 className={styles.sectionTitle}>Avis Clients</h2>

            <div className={styles.ratingSummary}>
                <div className={styles.ratingDisplay}>
                    <div className={styles.ratingNumber}>
                        {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                    </div>
                    <div className={styles.starsContainer}>
                        {renderStars(Math.round(averageRating))}
                    </div>
                    <div className={styles.reviewsCount}>
                        Basé sur {totalReviews} avis
                    </div>
                </div>
                <button 
                    className={styles.writeReviewBtn}
                    onClick={() => setShowWriteReview(!showWriteReview)}
                >
                    Écrire un avis
                </button>
            </div>

            {/* Formulaire d'avis */}
            {showWriteReview && (
                <div className={styles.writeReviewForm}>
                    <h3>Écrire un avis</h3>
                    <form onSubmit={handleSubmitReview}>
                        <div className={styles.formGroup}>
                            <label>Nom *</label>
                            <input
                                type="text"
                                value={formData.authorName}
                                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email (optionnel)</label>
                            <input
                                type="email"
                                value={formData.authorEmail}
                                onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Note *</label>
                            <div className={styles.ratingInput}>
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                        key={rating}
                                        type="button"
                                        className={`${styles.starButton} ${formData.rating >= rating ? styles.starSelected : ''}`}
                                        onClick={() => setFormData({ ...formData, rating })}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Commentaire *</label>
                            <textarea
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                rows={5}
                                required
                            />
                        </div>
                        <div className={styles.formActions}>
                            <button
                                type="button"
                                onClick={() => setShowWriteReview(false)}
                                className={styles.cancelBtn}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={styles.submitBtn}
                            >
                                {submitting ? 'Publication...' : 'Publier l\'avis'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

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

            {loading ? (
                <div className={styles.loading}>Chargement des avis...</div>
            ) : reviews.length > 0 ? (
                <div className={styles.reviewsList}>
                    {reviews.map((review) => (
                        <div key={review.id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.reviewerInfo}>
                                    <div className={styles.avatar}>
                                        {getInitials(review.author_name)}
                                    </div>
                                    <div>
                                        <div className={styles.reviewerName}>{review.author_name}</div>
                                        <div className={styles.reviewDate}>{formatDate(review.created_at)}</div>
                                    </div>
                                </div>
                                <div className={styles.reviewRating}>
                                    {renderStars(review.rating)}
                                </div>
                            </div>
                            <p className={styles.reviewComment}>{review.comment}</p>
                            <div className={styles.reviewActions}>
                                <button className={styles.actionBtn}>
                                    👍 {review.likes || 0}
                                </button>
                                <button className={styles.actionBtn}>
                                    👎 {review.dislikes || 0}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.noReviews}>
                    <p>Aucun avis pour ce produit. Soyez le premier à écrire un avis !</p>
                </div>
            )}
        </div>
    );
}

