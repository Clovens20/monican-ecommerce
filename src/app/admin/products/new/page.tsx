import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Ajouter un Produit</h1>
            <ProductForm />
        </div>
    );
}
