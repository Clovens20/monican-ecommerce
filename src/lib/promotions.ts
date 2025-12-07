// ============================================================================
// PROMOTIONS - Calcul et application des promotions
// ============================================================================

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applies_to: 'all' | 'category' | 'product' | 'products';
  category: string | null;
  product_ids: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  priority: number;
  promo_code: string | null;
  min_purchase_amount: number;
  max_uses: number | null;
  current_uses: number;
  banner_text: string | null;
}

export interface ProductWithPromotion {
  productId: string;
  category: string;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  promotion: Promotion | null;
}

/**
 * Calcule le prix avec promotion pour un produit
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  promotion: Promotion
): { discountedPrice: number; discountAmount: number } {
  let discountAmount = 0;

  if (promotion.discount_type === 'percentage') {
    discountAmount = (originalPrice * promotion.discount_value) / 100;
  } else {
    discountAmount = Math.min(promotion.discount_value, originalPrice);
  }

  const discountedPrice = Math.max(0, originalPrice - discountAmount);

  return {
    discountedPrice: Math.round(discountedPrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
  };
}

/**
 * Trouve la meilleure promotion applicable pour un produit
 */
export function findBestPromotion(
  promotions: Promotion[],
  productId: string,
  category: string,
  subtotal: number = 0
): Promotion | null {
  // Filtrer les promotions applicables
  const applicablePromotions = promotions.filter(promo => {
    // Vérifier le montant minimum
    if (promo.min_purchase_amount > 0 && subtotal < promo.min_purchase_amount) {
      return false;
    }

    // Vérifier selon applies_to
    if (promo.applies_to === 'all') {
      return true;
    }

    if (promo.applies_to === 'category' && promo.category === category) {
      return true;
    }

    if (promo.applies_to === 'products' && promo.product_ids?.includes(productId)) {
      return true;
    }

    return false;
  });

  if (applicablePromotions.length === 0) {
    return null;
  }

  // Trier par priorité (plus élevé = meilleur) et retourner la première
  applicablePromotions.sort((a, b) => b.priority - a.priority);

  return applicablePromotions[0];
}

/**
 * Applique les promotions à une liste de produits
 */
export function applyPromotionsToProducts(
  products: Array<{ id: string; category: string; price: number }>,
  promotions: Promotion[],
  subtotal: number = 0
): ProductWithPromotion[] {
  return products.map(product => {
    const promotion = findBestPromotion(
      promotions,
      product.id,
      product.category,
      subtotal
    );

    if (!promotion) {
      return {
        productId: product.id,
        category: product.category,
        originalPrice: product.price,
        discountedPrice: product.price,
        discountAmount: 0,
        promotion: null,
      };
    }

    const { discountedPrice, discountAmount } = calculateDiscountedPrice(
      product.price,
      promotion
    );

    return {
      productId: product.id,
      category: product.category,
      originalPrice: product.price,
      discountedPrice,
      discountAmount,
      promotion,
    };
  });
}

