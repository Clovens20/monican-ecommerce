'use client';

import { useState } from 'react';
import Modal from './Modal';
import { useLanguage } from '@/contexts/LanguageContext';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SizeCategory = 'clothing' | 'shoes' | 'accessories';

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
    const { t } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState<SizeCategory>('clothing');

    const sizeGuides = {
        clothing: {
            title: 'Guide des Tailles - Vêtements',
            sizes: [
                { size: 'XS', chest: '86-91 cm', waist: '71-76 cm', hip: '86-91 cm', us: '32-34', eu: '42-44' },
                { size: 'S', chest: '91-97 cm', waist: '76-81 cm', hip: '91-97 cm', us: '34-36', eu: '44-46' },
                { size: 'M', chest: '97-102 cm', waist: '81-86 cm', hip: '97-102 cm', us: '36-38', eu: '46-48' },
                { size: 'L', chest: '102-107 cm', waist: '86-91 cm', hip: '102-107 cm', us: '38-40', eu: '48-50' },
                { size: 'XL', chest: '107-112 cm', waist: '91-97 cm', hip: '107-112 cm', us: '40-42', eu: '50-52' },
                { size: 'XXL', chest: '112-117 cm', waist: '97-102 cm', hip: '112-117 cm', us: '42-44', eu: '52-54' },
            ]
        },
        shoes: {
            title: 'Guide des Tailles - Chaussures',
            sizes: [
                { size: '38', us: '7', uk: '5', cm: '24.0 cm' },
                { size: '39', us: '8', uk: '6', cm: '24.5 cm' },
                { size: '40', us: '8.5', uk: '6.5', cm: '25.0 cm' },
                { size: '41', us: '9', uk: '7', cm: '25.5 cm' },
                { size: '42', us: '9.5', uk: '7.5', cm: '26.0 cm' },
                { size: '43', us: '10', uk: '8', cm: '26.5 cm' },
                { size: '44', us: '11', uk: '9', cm: '27.0 cm' },
                { size: '45', us: '11.5', uk: '9.5', cm: '27.5 cm' },
            ]
        },
        accessories: {
            title: 'Guide des Tailles - Accessoires',
            sizes: [
                { type: 'Casquettes', sizes: 'Taille unique (ajustable)' },
                { type: 'Sacs', sizes: 'Dimensions: 35 x 40 x 15 cm' },
                { type: 'Ceintures', sizes: 'S, M, L, XL (80-120 cm)' },
                { type: 'Montres', sizes: 'Bracelet ajustable (16-22 cm)' },
            ]
        }
    };

    const currentGuide = sizeGuides[selectedCategory];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Taille & Ajustement" icon="📏">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Category Selector */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                    <button
                        onClick={() => setSelectedCategory('clothing')}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: selectedCategory === 'clothing' ? '#111827' : '#f3f4f6',
                            color: selectedCategory === 'clothing' ? 'white' : '#6b7280',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        👕 Vêtements
                    </button>
                    <button
                        onClick={() => setSelectedCategory('shoes')}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: selectedCategory === 'shoes' ? '#111827' : '#f3f4f6',
                            color: selectedCategory === 'shoes' ? 'white' : '#6b7280',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        👟 Chaussures
                    </button>
                    <button
                        onClick={() => setSelectedCategory('accessories')}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: selectedCategory === 'accessories' ? '#111827' : '#f3f4f6',
                            color: selectedCategory === 'accessories' ? 'white' : '#6b7280',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        🎒 Accessoires
                    </button>
                </div>

                {/* Size Guide Content */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                        {currentGuide.title}
                    </h3>

                    {selectedCategory === 'clothing' && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Taille</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Poitrine</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Taille</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Hanches</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>US</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>EU</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentGuide.sizes.map((item: any, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.size}</td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{item.chest}</td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{item.waist}</td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{item.hip}</td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{item.us}</td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{item.eu}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {selectedCategory === 'shoes' && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>EU</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>US</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>UK</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Longueur (cm)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentGuide.sizes.map((item: any, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.size}</td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{item.us}</td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{item.uk}</td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{item.cm}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {selectedCategory === 'accessories' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {currentGuide.sizes.map((item: any, index) => (
                                <div key={index} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#111827' }}>
                                        {item.type}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                        {item.sizes}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Measurement Tips */}
                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #86efac' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#065f46' }}>
                        💡 Conseils de Mesure
                    </div>
                    <ul style={{ fontSize: '0.9rem', color: '#047857', marginLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <li>Mesurez-vous le matin pour des résultats plus précis</li>
                        <li>Portez des vêtements légers lors de la mesure</li>
                        <li>Utilisez un mètre ruban souple</li>
                        <li>Pour les chaussures, mesurez vos pieds en fin de journée</li>
                        <li>En cas de doute, choisissez la taille supérieure</li>
                    </ul>
                </div>

                {/* Need Help */}
                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                        Besoin d'aide pour choisir votre taille ? <strong>Contactez-nous</strong> et nous vous aiderons à trouver la taille parfaite !
                    </div>
                </div>
            </div>
        </Modal>
    );
}

