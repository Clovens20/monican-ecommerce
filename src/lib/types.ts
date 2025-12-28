// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface ProductImage {
    id: string;
    url: string;
    alt: string;
    isPrimary: boolean;
    type?: 'image' | 'video'; // Nouveau: type de média
}

export interface ProductVariant {
    size: string;
    stock: number;
    sku: string;
    color?: string; // Optionnel pour rétrocompatibilité
}

// Nouvelle structure pour gérer le stock par couleur et taille
export interface ColorSizeStock {
    color: string;
    size: string;
    stock: number;
    sku: string;
}

export interface ProductFeature {
    name: string;
    value: string;
}

export type ProductCategory = 'tennis' | 'chemises' | 'jeans' | 'maillots' | 'accessoires' | 'chaussures';

export interface Product {
    id: string;
    name: string;
    price: number;
    comparePrice?: number | null;
    category: ProductCategory;
    images: ProductImage[];
    variants: ProductVariant[];
    description: string;
    detailedDescription: string;
    features: ProductFeature[];
    isNew?: boolean;
    isFeatured?: boolean;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

// Nouveau: Type pour les langues supportées
export type OrderLanguage = 'en' | 'fr' | 'es' | 'de' | 'it';

export interface OrderItem {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    price: number;
    size: string;
    image: string;
}

export interface ShippingAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: 'US' | 'CA' | 'MX' | 'FR' | 'UK' | 'DE' | 'ES' | 'IT'; // Ajout de plus de pays
}

export interface OrderStatusHistory {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    updatedBy?: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: ShippingAddress;
    items: OrderItem[];
    status: OrderStatus;
    statusHistory: OrderStatusHistory[];
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    currency: 'USD' | 'CAD' | 'MXN' | 'EUR' | 'GBP'; // Ajout de EUR et GBP
    date: string;
    trackingNumber?: string;
    paymentMethod: string;
    paymentId?: string; // ID du paiement Stripe pour remboursement
    internalNotes?: string;
    language?: OrderLanguage; // NOUVEAU: Langue de la facture/documents
}

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'admin' | 'subadmin' | 'customer';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    lastLogin?: string;
}

export interface Admin extends User {
    role: 'admin';
    permissions: string[];
}

export interface SubAdmin extends User {
    role: 'subadmin';
    code: string; // Unique code like MON-001 (automatically generated with 3 digits)
    isActive: boolean;
    assignedBy: string; // Admin ID
}

export interface Customer extends User {
    role: 'customer';
    phone?: string;
    shippingAddresses: ShippingAddress[];
    totalOrders: number;
    totalSpent: number;
}

// ============================================================================
// FINANCE TYPES
// ============================================================================

export interface RevenueByCountry {
    country: 'US' | 'CA' | 'MX';
    revenue: number;
    currency: 'USD' | 'CAD' | 'MXN';
    orderCount: number;
}

export interface DailyRevenue {
    date: string;
    revenue: number;
    orderCount: number;
}

export interface FinancialStats {
    totalRevenue: number;
    revenueByCountry: RevenueByCountry[];
    dailyRevenue: DailyRevenue[];
    averageOrderValue: number;
    topSellingProducts: {
        productId: string;
        productName: string;
        unitsSold: number;
        revenue: number;
    }[];
}

// ============================================================================
// SHIPPING TYPES
// ============================================================================

export interface ShippingRule {
    country: 'US' | 'CA' | 'MX';
    baseRate: number;
    currency: 'USD' | 'CAD' | 'MXN';
    freeShippingThreshold?: number;
    estimatedDays: {
        min: number;
        max: number;
    };
}

// ============================================================================
// CART TYPES (extending existing)
// ============================================================================

export interface CartItem {
    product: Product;
    size: string;
    quantity: number;
}

export interface Cart {
    items: CartItem[];
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    currency: 'USD' | 'CAD' | 'MXN';
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthSession {
    user: User;
    token: string;
    expiresAt: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SubAdminLoginCredentials {
    code: string;
}