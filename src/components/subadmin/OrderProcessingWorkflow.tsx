'use client';

import { useState } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import styles from './OrderProcessingWorkflow.module.css';

interface OrderProcessingWorkflowProps {
    order: Order;
    subAdminCode: string;
    onStatusUpdate: (orderId: string, newStatus: OrderStatus, trackingNumber?: string) => void;
    onClose: () => void;
}

type WorkflowStep = 'verify' | 'prepare' | 'package' | 'ship';

export default function OrderProcessingWorkflow({
    order,
    subAdminCode,
    onStatusUpdate,
    onClose
}: OrderProcessingWorkflowProps) {
    const [currentStep, setCurrentStep] = useState<WorkflowStep>(
        order.status === 'pending' ? 'verify' : 'prepare'
    );
    const [trackingNumber, setTrackingNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([]);

    const steps: { key: WorkflowStep; label: string; description: string; icon: string }[] = [
        {
            key: 'verify',
            label: 'Vérification',
            description: 'Vérifier les articles et l\'adresse',
            icon: '✓'
        },
        {
            key: 'prepare',
            label: 'Préparation',
            description: 'Préparer les articles',
            icon: '📦'
        },
        {
            key: 'package',
            label: 'Emballage',
            description: 'Emballer la commande',
            icon: '📋'
        },
        {
            key: 'ship',
            label: 'Expédition',
            description: 'Ajouter le numéro de suivi',
            icon: '🚚'
        }
    ];

    const handleStepComplete = (step: WorkflowStep) => {
        if (!completedSteps.includes(step)) {
            setCompletedSteps([...completedSteps, step]);
        }

        const stepIndex = steps.findIndex(s => s.key === step);
        if (stepIndex < steps.length - 1) {
            setCurrentStep(steps[stepIndex + 1].key);
        }
    };

    const handleFinalize = () => {
        if (currentStep === 'ship' && !trackingNumber.trim()) {
            alert('Veuillez entrer le numéro de suivi USPS avant de finaliser l\'expédition');
            return;
        }

        if (currentStep === 'ship') {
            onStatusUpdate(order.id, 'shipped', trackingNumber);
            alert(`Commande ${order.orderNumber || order.id} expédiée avec succès!\nNuméro de suivi: ${trackingNumber}`);
            onClose();
        } else {
            const nextStatus = currentStep === 'verify' ? 'processing' : order.status;
            onStatusUpdate(order.id, nextStatus);
            handleStepComplete(currentStep);
        }
    };

    const getStepStatus = (step: WorkflowStep) => {
        if (completedSteps.includes(step)) return 'completed';
        if (currentStep === step) return 'active';
        const stepIndex = steps.findIndex(s => s.key === step);
        const currentIndex = steps.findIndex(s => s.key === currentStep);
        return stepIndex < currentIndex ? 'completed' : 'pending';
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Traitement de la Commande {order.orderNumber || order.id}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                {/* Workflow Steps */}
                <div className={styles.workflowSteps}>
                    {steps.map((step, index) => {
                        const status = getStepStatus(step.key);
                        return (
                            <div key={step.key} className={styles.stepContainer}>
                                <div className={`${styles.stepConnector} ${index > 0 ? styles.visible : ''} ${status === 'completed' || status === 'active' ? styles.completed : ''}`}></div>
                                <div className={`${styles.stepCircle} ${styles[status]}`}>
                                    {status === 'completed' ? '✓' : step.icon}
                                </div>
                                <div className={styles.stepInfo}>
                                    <div className={styles.stepLabel}>{step.label}</div>
                                    <div className={styles.stepDescription}>{step.description}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className={styles.stepContent}>
                    {currentStep === 'verify' && (
                        <div className={styles.stepPanel}>
                            <h3 className={styles.panelTitle}>✓ Vérification de la Commande</h3>
                            <div className={styles.checklist}>
                                <div className={styles.checklistItem}>
                                    <input type="checkbox" id="check-items" />
                                    <label htmlFor="check-items">Tous les articles sont disponibles en stock</label>
                                </div>
                                <div className={styles.checklistItem}>
                                    <input type="checkbox" id="check-address" />
                                    <label htmlFor="check-address">Adresse de livraison complète et valide</label>
                                </div>
                                <div className={styles.checklistItem}>
                                    <input type="checkbox" id="check-payment" />
                                    <label htmlFor="check-payment">Paiement confirmé</label>
                                </div>
                            </div>
                            <div className={styles.orderSummary}>
                                <h4>Résumé de la Commande</h4>
                                <p><strong>Client:</strong> {order.customerName}</p>
                                <p><strong>Articles:</strong> {order.items.length} produit(s)</p>
                                <p><strong>Total:</strong> {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: order.currency }).format(order.total)}</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 'prepare' && (
                        <div className={styles.stepPanel}>
                            <h3 className={styles.panelTitle}>📦 Préparation des Articles</h3>
                            <div className={styles.itemsList}>
                                {order.items.map((item) => (
                                    <div key={item.id} className={styles.itemCard}>
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemImage}></div>
                                            <div>
                                                <div className={styles.itemName}>{item.name}</div>
                                                <div className={styles.itemDetails}>
                                                    Taille: {item.size} | Quantité: {item.quantity}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.itemCheckbox}>
                                            <input type="checkbox" />
                                            <span>Préparé</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 'package' && (
                        <div className={styles.stepPanel}>
                            <h3 className={styles.panelTitle}>📋 Emballage de la Commande</h3>
                            <div className={styles.packageChecklist}>
                                <div className={styles.checklistItem}>
                                    <input type="checkbox" id="package-box" />
                                    <label htmlFor="package-box">Boîte d'emballage appropriée sélectionnée</label>
                                </div>
                                <div className={styles.checklistItem}>
                                    <input type="checkbox" id="package-protect" />
                                    <label htmlFor="package-protect">Articles protégés avec matériau de rembourrage</label>
                                </div>
                                <div className={styles.checklistItem}>
                                    <input type="checkbox" id="package-seal" />
                                    <label htmlFor="package-seal">Colis scellé et sécurisé</label>
                                </div>
                                <div className={styles.checklistItem}>
                                    <input type="checkbox" id="package-label" />
                                    <label htmlFor="package-label">Étiquette d'adresse apposée</label>
                                </div>
                            </div>
                            <div className={styles.notesSection}>
                                <label className={styles.label}>Notes (optionnel)</label>
                                <textarea
                                    className={styles.textarea}
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ajoutez des notes sur l'emballage..."
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 'ship' && (
                        <div className={styles.stepPanel}>
                            <h3 className={styles.panelTitle}>🚚 Expédition - Numéro de Suivi USPS</h3>
                            <div className={styles.shippingInfo}>
                                <p className={styles.infoText}>
                                    <strong>Important:</strong> Avant de finaliser l'expédition, vous devez déposer le colis 
                                    à USPS et obtenir le numéro de suivi. Ce numéro sera envoyé au client pour qu'il puisse 
                                    suivre sa commande.
                                </p>
                                
                                <div className={styles.trackingSection}>
                                    <label className={styles.label}>
                                        Numéro de Suivi USPS *
                                    </label>
                                    <input
                                        type="text"
                                        className={styles.trackingInput}
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                                        placeholder="Ex: USPS9400100000000000000001"
                                        required
                                    />
                                    <p className={styles.helpText}>
                                        Format: USPS suivi de 22 chiffres (ex: USPS9400100000000000000001)
                                    </p>
                                </div>

                                <div className={styles.shippingDetails}>
                                    <h4>Détails de Livraison</h4>
                                    <div className={styles.detailsGrid}>
                                        <div>
                                            <strong>Adresse:</strong>
                                            <p>{order.shippingAddress.street}</p>
                                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                                            <p>{order.shippingAddress.country === 'US' ? '🇺🇸 États-Unis' : order.shippingAddress.country === 'CA' ? '🇨🇦 Canada' : '🇲🇽 Mexique'}</p>
                                        </div>
                                        <div>
                                            <strong>Client:</strong>
                                            <p>{order.customerName}</p>
                                            <p>{order.customerEmail}</p>
                                            <p>{order.customerPhone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Annuler
                    </button>
                    <button
                        className={styles.continueBtn}
                        onClick={handleFinalize}
                        disabled={currentStep === 'ship' && !trackingNumber.trim()}
                    >
                        {currentStep === 'ship' 
                            ? '✅ Finaliser l\'Expédition' 
                            : currentStep === 'verify'
                            ? 'Marquer en Traitement'
                            : 'Continuer →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
