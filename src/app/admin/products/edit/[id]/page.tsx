'use client';

import { useEffect, useState, Suspense } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

function EditProductContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProduct() {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(`/api/admin/products/${id}`);
                const data = await response.json();

                if (data.success && data.product) {
                    // Transformer les données pour le formulaire
                    const formData = {
                        id: data.product.id,
                        name: data.product.name,
                        category: data.product.category,
                        price: data.product.price,
                        comparePrice: data.product.comparePrice || null,
                        sku: data.product.sku || '',
                        description: data.product.description || '',
                        detailedDescription: data.product.detailedDescription || '',
                        brand: data.product.brand || '',
                        model: data.product.model || '',
                        images: data.product.images || [],
                        variants: data.product.variants || [],
                        colorSizeStocks: data.product.colorSizeStocks || [],
                        features: data.product.features || [],
                        colors: data.product.colors || [],
                        isNew: data.product.isNew || false,
                        isFeatured: data.product.isFeatured || false,
                        isActive: data.product.isActive !== false,
                    };
                    setProduct(formData);
                } else {
                    setError(data.error || 'Produit non trouvé');
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Erreur lors du chargement du produit');
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchProduct();
        }
    }, [id]);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '50vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ fontSize: '2rem' }}>⏳</div>
                <p>Chargement du produit...</p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '50vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ fontSize: '3rem' }}>⚠️</div>
                <h2>{error || 'Produit non trouvé'}</h2>
                <button
                    onClick={() => router.push('/admin/products')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#3B82F6',
                        color: 'white',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Modifier le produit: {product.name}
            </h1>
            <ProductForm initialData={product} />
        </div>
    );
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '50vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ fontSize: '2rem' }}>⏳</div>
                <p>Chargement...</p>
            </div>
        }>
            <EditProductContent params={params} />
        </Suspense>
    );
}

