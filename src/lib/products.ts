import { Product, ProductImage, ProductVariant, ProductFeature } from './types';

// Re-export Product type for convenience
export type { Product } from './types';

// ============================================================================
// MOCK PRODUCTS DATA
// ============================================================================

export const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Tennis Urban Runner',
        price: 89.99,
        category: 'tennis',
        images: [
            { id: 'img-1-1', url: '/products/tennis-urban-1.jpg', alt: 'Tennis Urban Runner - Vue principale', isPrimary: true },
            { id: 'img-1-2', url: '/products/tennis-urban-2.jpg', alt: 'Tennis Urban Runner - Vue côté', isPrimary: false },
            { id: 'img-1-3', url: '/products/tennis-urban-3.jpg', alt: 'Tennis Urban Runner - Vue arrière', isPrimary: false },
            { id: 'img-1-4', url: '/products/tennis-urban-4.jpg', alt: 'Tennis Urban Runner - Détail semelle', isPrimary: false },
        ],
        variants: [
            { size: '40', stock: 15, sku: 'TUR-40' },
            { size: '41', stock: 23, sku: 'TUR-41' },
            { size: '42', stock: 18, sku: 'TUR-42' },
            { size: '43', stock: 12, sku: 'TUR-43' },
            { size: '44', stock: 8, sku: 'TUR-44' },
        ],
        description: 'Tennis confortables pour la ville. Design moderne et respirant.',
        detailedDescription: 'Les Tennis Urban Runner sont conçues pour allier style et confort au quotidien. Leur design épuré et moderne s\'adapte à toutes vos tenues urbaines, tandis que leur construction respirante assure un confort optimal tout au long de la journée. La semelle en caoutchouc offre une excellente adhérence et durabilité.',
        features: [
            { name: 'Matériau', value: 'Mesh respirant et synthétique' },
            { name: 'Semelle', value: 'Caoutchouc antidérapant' },
            { name: 'Poids', value: '280g (taille 42)' },
            { name: 'Couleur', value: 'Noir/Blanc' },
            { name: 'Entretien', value: 'Nettoyage à la main recommandé' },
        ],
        isNew: true,
        isFeatured: true,
        createdAt: '2025-11-20T10:00:00Z',
        updatedAt: '2025-11-24T15:30:00Z',
    },
    {
        id: '2',
        name: 'Chemise Oxford Blue',
        price: 45.00,
        category: 'chemises',
        images: [
            { id: 'img-2-1', url: '/products/shirt-oxford-1.jpg', alt: 'Chemise Oxford Blue - Vue principale', isPrimary: true },
            { id: 'img-2-2', url: '/products/shirt-oxford-2.jpg', alt: 'Chemise Oxford Blue - Détail col', isPrimary: false },
            { id: 'img-2-3', url: '/products/shirt-oxford-3.jpg', alt: 'Chemise Oxford Blue - Vue portée', isPrimary: false },
        ],
        variants: [
            { size: 'S', stock: 20, sku: 'OXF-S' },
            { size: 'M', stock: 35, sku: 'OXF-M' },
            { size: 'L', stock: 28, sku: 'OXF-L' },
            { size: 'XL', stock: 15, sku: 'OXF-XL' },
        ],
        description: 'Chemise classique en coton premium. Coupe ajustée.',
        detailedDescription: 'Notre chemise Oxford Blue est un incontournable de la garde-robe masculine. Fabriquée en coton 100% premium, elle offre un confort exceptionnel et une durabilité remarquable. Sa coupe ajustée moderne flattera votre silhouette tout en vous laissant une liberté de mouvement optimale. Parfaite pour le bureau ou les occasions semi-formelles.',
        features: [
            { name: 'Matériau', value: '100% Coton Premium' },
            { name: 'Coupe', value: 'Ajustée (Slim Fit)' },
            { name: 'Col', value: 'Col boutonné' },
            { name: 'Couleur', value: 'Bleu Oxford' },
            { name: 'Entretien', value: 'Lavable en machine à 30°C' },
        ],
        isNew: false,
        isFeatured: true,
        createdAt: '2025-10-15T08:00:00Z',
        updatedAt: '2025-11-22T12:00:00Z',
    },
    {
        id: '3',
        name: 'Jeans Slim Fit Indigo',
        price: 59.50,
        category: 'jeans',
        images: [
            { id: 'img-3-1', url: '/products/jeans-slim-1.jpg', alt: 'Jeans Slim Fit - Vue principale', isPrimary: true },
            { id: 'img-3-2', url: '/products/jeans-slim-2.jpg', alt: 'Jeans Slim Fit - Vue arrière', isPrimary: false },
            { id: 'img-3-3', url: '/products/jeans-slim-3.jpg', alt: 'Jeans Slim Fit - Détail poche', isPrimary: false },
        ],
        variants: [
            { size: '30', stock: 12, sku: 'JSF-30' },
            { size: '32', stock: 25, sku: 'JSF-32' },
            { size: '34', stock: 30, sku: 'JSF-34' },
            { size: '36', stock: 18, sku: 'JSF-36' },
            { size: '38', stock: 10, sku: 'JSF-38' },
        ],
        description: 'Jeans denim durable avec une coupe moderne.',
        detailedDescription: 'Ce jean slim fit en denim indigo de qualité supérieure combine style contemporain et confort. Sa coupe ajustée met en valeur votre silhouette sans compromettre le confort. Le tissu stretch permet une grande liberté de mouvement. Un essentiel polyvalent qui s\'adapte à toutes les occasions.',
        features: [
            { name: 'Matériau', value: '98% Coton, 2% Élasthanne' },
            { name: 'Coupe', value: 'Slim Fit' },
            { name: 'Couleur', value: 'Indigo foncé' },
            { name: 'Poches', value: '5 poches classiques' },
            { name: 'Entretien', value: 'Lavable en machine à 30°C' },
        ],
        isNew: false,
        isFeatured: true,
        createdAt: '2025-09-10T10:00:00Z',
        updatedAt: '2025-11-20T09:00:00Z',
    },
    {
        id: '4',
        name: 'Maillot Sport Pro',
        price: 29.99,
        category: 'maillots',
        images: [
            { id: 'img-4-1', url: '/products/jersey-pro-1.jpg', alt: 'Maillot Sport Pro - Vue principale', isPrimary: true },
            { id: 'img-4-2', url: '/products/jersey-pro-2.jpg', alt: 'Maillot Sport Pro - Vue dos', isPrimary: false },
        ],
        variants: [
            { size: 'M', stock: 40, sku: 'MSP-M' },
            { size: 'L', stock: 35, sku: 'MSP-L' },
            { size: 'XL', stock: 25, sku: 'MSP-XL' },
        ],
        description: 'Maillot technique pour le sport intensif.',
        detailedDescription: 'Le Maillot Sport Pro est conçu pour les athlètes exigeants. Sa technologie d\'évacuation de l\'humidité vous garde au sec pendant l\'effort. Le tissu ultra-léger et respirant offre un confort maximal. Les coutures plates réduisent les frottements pour une performance optimale.',
        features: [
            { name: 'Matériau', value: '100% Polyester technique' },
            { name: 'Technologie', value: 'Évacuation de l\'humidité' },
            { name: 'Poids', value: '120g (taille L)' },
            { name: 'Couleur', value: 'Noir/Rouge' },
            { name: 'Entretien', value: 'Lavable en machine à 30°C' },
        ],
        isNew: true,
        isFeatured: false,
        createdAt: '2025-11-18T14:00:00Z',
        updatedAt: '2025-11-23T16:00:00Z',
    },
    {
        id: '5',
        name: 'Baskets Running Pro',
        price: 119.99,
        category: 'tennis',
        images: [
            { id: 'img-5-1', url: '/products/running-pro-1.jpg', alt: 'Baskets Running Pro', isPrimary: true },
            { id: 'img-5-2', url: '/products/running-pro-2.jpg', alt: 'Baskets Running Pro - Côté', isPrimary: false },
            { id: 'img-5-3', url: '/products/running-pro-3.jpg', alt: 'Baskets Running Pro - Semelle', isPrimary: false },
        ],
        variants: [
            { size: '40', stock: 10, sku: 'BRP-40' },
            { size: '41', stock: 15, sku: 'BRP-41' },
            { size: '42', stock: 20, sku: 'BRP-42' },
            { size: '43', stock: 12, sku: 'BRP-43' },
            { size: '44', stock: 8, sku: 'BRP-44' },
            { size: '45', stock: 5, sku: 'BRP-45' },
        ],
        description: 'Chaussures de running haute performance avec amorti supérieur.',
        detailedDescription: 'Les Baskets Running Pro sont conçues pour les coureurs sérieux. Dotées d\'un système d\'amorti avancé, elles absorbent les chocs et protègent vos articulations. La semelle en caoutchouc haute densité offre une traction exceptionnelle sur toutes les surfaces.',
        features: [
            { name: 'Matériau', value: 'Mesh technique et synthétique' },
            { name: 'Amorti', value: 'Technologie CloudFoam' },
            { name: 'Semelle', value: 'Caoutchouc haute densité' },
            { name: 'Drop', value: '10mm' },
            { name: 'Poids', value: '290g (taille 42)' },
        ],
        isNew: true,
        isFeatured: true,
        createdAt: '2025-11-22T10:00:00Z',
        updatedAt: '2025-11-24T10:00:00Z',
    },
    {
        id: '6',
        name: 'Chemise Lin Blanc',
        price: 52.00,
        category: 'chemises',
        images: [
            { id: 'img-6-1', url: '/products/linen-white-1.jpg', alt: 'Chemise Lin Blanc', isPrimary: true },
            { id: 'img-6-2', url: '/products/linen-white-2.jpg', alt: 'Chemise Lin Blanc - Détail', isPrimary: false },
        ],
        variants: [
            { size: 'S', stock: 15, sku: 'CLB-S' },
            { size: 'M', stock: 25, sku: 'CLB-M' },
            { size: 'L', stock: 20, sku: 'CLB-L' },
            { size: 'XL', stock: 12, sku: 'CLB-XL' },
        ],
        description: 'Chemise en lin naturel, parfaite pour l\'été.',
        detailedDescription: 'Cette chemise en lin 100% naturel est l\'incarnation de l\'élégance décontractée. Le lin offre une respirabilité exceptionnelle, idéale pour les journées chaudes. Sa texture naturelle et son tombé fluide créent un look sophistiqué et décontracté.',
        features: [
            { name: 'Matériau', value: '100% Lin naturel' },
            { name: 'Coupe', value: 'Regular Fit' },
            { name: 'Col', value: 'Col italien' },
            { name: 'Couleur', value: 'Blanc cassé' },
            { name: 'Entretien', value: 'Lavage délicat à 30°C' },
        ],
        isNew: false,
        isFeatured: false,
        createdAt: '2025-08-05T10:00:00Z',
        updatedAt: '2025-11-15T10:00:00Z',
    },
    {
        id: '7',
        name: 'Jean Cargo Noir',
        price: 69.99,
        category: 'jeans',
        images: [
            { id: 'img-7-1', url: '/products/cargo-black-1.jpg', alt: 'Jean Cargo Noir', isPrimary: true },
            { id: 'img-7-2', url: '/products/cargo-black-2.jpg', alt: 'Jean Cargo Noir - Poches', isPrimary: false },
        ],
        variants: [
            { size: '30', stock: 8, sku: 'JCN-30' },
            { size: '32', stock: 18, sku: 'JCN-32' },
            { size: '34', stock: 22, sku: 'JCN-34' },
            { size: '36', stock: 15, sku: 'JCN-36' },
        ],
        description: 'Jean cargo style urbain avec poches multiples.',
        detailedDescription: 'Le Jean Cargo Noir combine fonctionnalité et style urbain. Ses multiples poches offrent un rangement pratique, tandis que sa coupe moderne assure un look contemporain. Fabriqué en denim résistant pour une durabilité maximale.',
        features: [
            { name: 'Matériau', value: '100% Coton denim' },
            { name: 'Coupe', value: 'Regular Fit' },
            { name: 'Poches', value: '8 poches dont 4 cargo' },
            { name: 'Couleur', value: 'Noir profond' },
            { name: 'Entretien', value: 'Lavable en machine à 30°C' },
        ],
        isNew: true,
        isFeatured: false,
        createdAt: '2025-11-19T10:00:00Z',
        updatedAt: '2025-11-24T10:00:00Z',
    },
    {
        id: '8',
        name: 'T-Shirt Performance',
        price: 24.99,
        category: 'maillots',
        images: [
            { id: 'img-8-1', url: '/products/tshirt-perf-1.jpg', alt: 'T-Shirt Performance', isPrimary: true },
        ],
        variants: [
            { size: 'S', stock: 30, sku: 'TSP-S' },
            { size: 'M', stock: 45, sku: 'TSP-M' },
            { size: 'L', stock: 40, sku: 'TSP-L' },
            { size: 'XL', stock: 25, sku: 'TSP-XL' },
        ],
        description: 'T-shirt technique respirant pour l\'entraînement.',
        detailedDescription: 'Ce t-shirt de performance est conçu pour vous accompagner dans tous vos entraînements. Le tissu technique évacue rapidement l\'humidité pour vous garder au sec. Coupe athlétique qui suit vos mouvements.',
        features: [
            { name: 'Matériau', value: '92% Polyester, 8% Élasthanne' },
            { name: 'Technologie', value: 'Quick-Dry' },
            { name: 'Coupe', value: 'Athletic Fit' },
            { name: 'Couleur', value: 'Gris chiné' },
            { name: 'Entretien', value: 'Lavable en machine à 30°C' },
        ],
        isNew: false,
        isFeatured: false,
        createdAt: '2025-10-01T10:00:00Z',
        updatedAt: '2025-11-10T10:00:00Z',
    },
    {
        id: '9',
        name: 'Sneakers Classic White',
        price: 79.99,
        category: 'tennis',
        images: [
            { id: 'img-9-1', url: '/products/sneaker-white-1.jpg', alt: 'Sneakers Classic White', isPrimary: true },
            { id: 'img-9-2', url: '/products/sneaker-white-2.jpg', alt: 'Sneakers Classic White - Profil', isPrimary: false },
        ],
        variants: [
            { size: '39', stock: 12, sku: 'SCW-39' },
            { size: '40', stock: 20, sku: 'SCW-40' },
            { size: '41', stock: 25, sku: 'SCW-41' },
            { size: '42', stock: 22, sku: 'SCW-42' },
            { size: '43', stock: 15, sku: 'SCW-43' },
            { size: '44', stock: 10, sku: 'SCW-44' },
        ],
        description: 'Sneakers blanches intemporelles, style minimaliste.',
        detailedDescription: 'Les Sneakers Classic White sont l\'essence du style minimaliste. Leur design épuré et intemporel s\'associe à toutes vos tenues. Fabriquées en cuir synthétique de qualité supérieure, elles offrent confort et durabilité.',
        features: [
            { name: 'Matériau', value: 'Cuir synthétique premium' },
            { name: 'Semelle', value: 'Caoutchouc vulcanisé' },
            { name: 'Style', value: 'Minimaliste' },
            { name: 'Couleur', value: 'Blanc pur' },
            { name: 'Entretien', value: 'Nettoyage avec chiffon humide' },
        ],
        isNew: false,
        isFeatured: true,
        createdAt: '2025-07-20T10:00:00Z',
        updatedAt: '2025-11-18T10:00:00Z',
    },
    {
        id: '10',
        name: 'Chemise Carreaux Rouge',
        price: 48.00,
        category: 'chemises',
        images: [
            { id: 'img-10-1', url: '/products/plaid-red-1.jpg', alt: 'Chemise Carreaux Rouge', isPrimary: true },
        ],
        variants: [
            { size: 'S', stock: 18, sku: 'CCR-S' },
            { size: 'M', stock: 28, sku: 'CCR-M' },
            { size: 'L', stock: 25, sku: 'CCR-L' },
            { size: 'XL', stock: 15, sku: 'CCR-XL' },
        ],
        description: 'Chemise à carreaux style bûcheron moderne.',
        detailedDescription: 'Cette chemise à carreaux revisite le classique style bûcheron avec une touche moderne. En flanelle douce et chaude, elle est parfaite pour la mi-saison. Le motif à carreaux rouge et noir apporte une touche de caractère à votre look.',
        features: [
            { name: 'Matériau', value: '100% Coton flanelle' },
            { name: 'Motif', value: 'Carreaux rouge et noir' },
            { name: 'Coupe', value: 'Regular Fit' },
            { name: 'Saison', value: 'Automne/Hiver' },
            { name: 'Entretien', value: 'Lavable en machine à 30°C' },
        ],
        isNew: false,
        isFeatured: false,
        createdAt: '2025-09-15T10:00:00Z',
        updatedAt: '2025-11-12T10:00:00Z',
    },
];

// Helper function to get product by ID
export function getProductById(id: string): Product | undefined {
    return mockProducts.find(p => p.id === id);
}

// Helper function to get products by category
export function getProductsByCategory(category: string): Product[] {
    return mockProducts.filter(p => p.category === category);
}

// Helper function to get featured products
export function getFeaturedProducts(): Product[] {
    return mockProducts.filter(p => p.isFeatured);
}

// Helper function to get new products
export function getNewProducts(): Product[] {
    return mockProducts.filter(p => p.isNew);
}
