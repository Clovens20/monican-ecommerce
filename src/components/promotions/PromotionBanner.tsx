'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './PromotionBanner.module.css';

interface Promotion {
  id: string;
  name: string;
  banner_text: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  promo_code: string | null;
  end_date: string;
}

export default function PromotionBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const response = await fetch('/api/promotions');
        if (response.ok) {
          const data = await response.json();
          // Filtrer seulement celles avec banner_text
          const withBanner = (data.promotions || []).filter((p: Promotion) => p.banner_text);
          setPromotions(withBanner);
        }
      } catch (err) {
        console.error('Error fetching promotions:', err);
      }
    }
    fetchPromotions();
  }, []);

  // Rotation automatique des promotions
  useEffect(() => {
    if (promotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, [promotions.length]);

  if (promotions.length === 0) {
    return null;
  }

  const currentPromotion = promotions[currentIndex];
  const formatDiscount = () => {
    if (currentPromotion.discount_type === 'percentage') {
      return `${currentPromotion.discount_value}%`;
    }
    return `$${currentPromotion.discount_value.toFixed(2)}`;
  };

  return (
    <div className={styles.banner}>
      <div className={styles.bannerContent}>
        <div className={styles.bannerText}>
          <span className={styles.bannerIcon}>🎁</span>
          <span className={styles.bannerMessage}>
            {currentPromotion.banner_text || currentPromotion.name}
          </span>
          {currentPromotion.promo_code && (
            <span className={styles.promoCode}>
              Code: {currentPromotion.promo_code}
            </span>
          )}
        </div>
        <Link href="/catalog" className={styles.bannerLink}>
          Voir les offres →
        </Link>
      </div>
      
      {promotions.length > 1 && (
        <div className={styles.bannerIndicators}>
          {promotions.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Promotion ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

