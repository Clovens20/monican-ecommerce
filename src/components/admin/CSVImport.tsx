// CHEMIN: src/components/admin/CSVImport.tsx
// ACTION: CRÉER CE FICHIER

'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import styles from './CSVImport.module.css';

interface ProductRow {
  nom: string;
  categorie: 'jeans' | 'maillot' | 'chemise' | 'tennis';
  description: string;
  prix: number;
  tailles: string;
  couleurs?: string;
  images?: string;
  marque?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function CSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ProductRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['jeans', 'maillot', 'chemise', 'tennis'];

  const validateRow = (row: any, index: number): ValidationError[] => {
    const rowErrors: ValidationError[] = [];

    if (!row.nom || row.nom.trim() === '') {
      rowErrors.push({ row: index, field: 'nom', message: 'Nom requis' });
    }

    if (!row.categorie || !categories.includes(row.categorie.toLowerCase())) {
      rowErrors.push({ 
        row: index, 
        field: 'categorie', 
        message: `Catégorie invalide. Valeurs: ${categories.join(', ')}` 
      });
    }

    const prix = parseFloat(row.prix);
    if (isNaN(prix) || prix <= 0) {
      rowErrors.push({ row: index, field: 'prix', message: 'Prix invalide (doit être > 0)' });
    }

    if (!row.tailles || row.tailles.trim() === '') {
      rowErrors.push({ row: index, field: 'tailles', message: 'Au moins une taille requise' });
    } else {
      const tailles = row.tailles.split(',');
      tailles.forEach((taille: string, idx: number) => {
        const parts = taille.trim().split(':');
        if (parts.length !== 3) {
          rowErrors.push({ 
            row: index, 
            field: 'tailles', 
            message: `Format invalide position ${idx + 1}. Attendu: "Taille:Stock:SKU"` 
          });
        } else {
          const stock = parseInt(parts[1]);
          if (isNaN(stock) || stock < 0) {
            rowErrors.push({ 
              row: index, 
              field: 'tailles', 
              message: `Stock invalide pour ${parts[0]}` 
            });
          }
        }
      });
    }

    return rowErrors;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setData([]);
      setErrors([]);
      setImportStatus('idle');
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const allErrors: ValidationError[] = [];
        const validData: ProductRow[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowErrors = validateRow(row, index + 2);
          
          if (rowErrors.length === 0) {
            validData.push({
              nom: row.nom.trim(),
              categorie: row.categorie.toLowerCase() as ProductRow['categorie'],
              description: row.description?.trim() || '',
              prix: parseFloat(row.prix),
              tailles: row.tailles.trim(),
              couleurs: row.couleurs?.trim() || '',
              images: row.images?.trim() || '',
              marque: row.marque?.trim() || '',
            });
          } else {
            allErrors.push(...rowErrors);
          }
        });

        setData(validData);
        setErrors(allErrors);
        setIsProcessing(false);
      },
      error: (error) => {
        console.error('Erreur parsing CSV:', error);
        setErrors([{ row: 0, field: 'fichier', message: 'Erreur lecture fichier' }]);
        setIsProcessing(false);
      }
    });
  };

  const handleImport = async () => {
    if (data.length === 0) return;

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/admin/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: data }),
      });

      if (response.ok) {
        setImportStatus('success');
        setTimeout(() => {
          window.location.href = '/admin/products';
        }, 2000);
      } else {
        setImportStatus('error');
      }
    } catch (error) {
      console.error('Erreur import:', error);
      setImportStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = `nom,categorie,description,prix,tailles,couleurs,images,marque
"Jean Slim Noir","jeans","Jean slim denim stretch confortable",89.99,"28:10:JEAN-28,30:15:JEAN-30,32:20:JEAN-32,34:12:JEAN-34","Noir,Bleu","https://example.com/jean1.jpg","DenimCo"
"T-Shirt Blanc Basic","maillot","T-shirt 100% coton qualité premium",29.99,"S:25:TEE-S,M:30:TEE-M,L:20:TEE-L,XL:15:TEE-XL","Blanc,Noir,Gris","https://example.com/tee1.jpg","BasicWear"
"Chemise Oxford Bleue","chemise","Chemise oxford col boutonné",79.99,"S:8:SHIRT-S,M:12:SHIRT-M,L:10:SHIRT-L,XL:6:SHIRT-XL","Bleu,Blanc","https://example.com/shirt1.jpg","FormalCo"
"Sneakers Blanches","tennis","Baskets en cuir blanc design minimaliste",149.99,"40:5:SNEAK-40,41:8:SNEAK-41,42:10:SNEAK-42,43:7:SNEAK-43,44:4:SNEAK-44","Blanc","https://example.com/sneakers1.jpg","StepStyle"`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_produits.csv';
    link.click();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Import CSV - Produits en Masse</h1>
        <button onClick={downloadTemplate} className={styles.btnSecondary}>
          📥 Télécharger Template
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.uploadZone}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className={styles.fileInput}
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className={styles.uploadLabel}>
            <div className={styles.uploadIcon}>📄</div>
            <div className={styles.uploadText}>
              {file ? file.name : 'Cliquez pour sélectionner un fichier CSV'}
            </div>
            <div className={styles.uploadHint}>Format: .csv (UTF-8)</div>
          </label>
        </div>

        {isProcessing && (
          <div className={styles.processing}>
            <div className={styles.spinner}></div>
            Traitement en cours...
          </div>
        )}

        {errors.length > 0 && (
          <div className={styles.errorsSection}>
            <h3 className={styles.errorsTitle}>⚠️ Erreurs détectées ({errors.length})</h3>
            <div className={styles.errorsList}>
              {errors.slice(0, 10).map((error, idx) => (
                <div key={idx} className={styles.errorItem}>
                  <span className={styles.errorRow}>Ligne {error.row}</span>
                  <span className={styles.errorField}>{error.field}</span>
                  <span className={styles.errorMessage}>{error.message}</span>
                </div>
              ))}
              {errors.length > 10 && (
                <div className={styles.errorMore}>
                  ... et {errors.length - 10} autres erreurs
                </div>
              )}
            </div>
          </div>
        )}

        {data.length > 0 && errors.length === 0 && (
          <div className={styles.successSection}>
            <div className={styles.successHeader}>
              <h3 className={styles.successTitle}>✅ Données validées</h3>
              <span className={styles.successCount}>{data.length} produits prêts</span>
            </div>
            
            <div className={styles.preview}>
              <h4 className={styles.previewTitle}>Aperçu (5 premiers produits)</h4>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Tailles</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.nom}</td>
                      <td className={styles.category}>{row.categorie}</td>
                      <td className={styles.price}>${row.prix.toFixed(2)}</td>
                      <td className={styles.sizes}>
                        {row.tailles.split(',').map(t => t.split(':')[0]).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              onClick={handleImport}
              className={styles.btnPrimary}
              disabled={isProcessing}
            >
              {isProcessing ? 'Import en cours...' : `Importer ${data.length} produits`}
            </button>
          </div>
        )}

        {importStatus === 'success' && (
          <div className={styles.statusSuccess}>
            ✅ Import réussi ! Redirection en cours...
          </div>
        )}

        {importStatus === 'error' && (
          <div className={styles.statusError}>
            ❌ Erreur lors de l'import. Veuillez réessayer.
          </div>
        )}
      </div>

      <div className={styles.instructions}>
        <h3>📋 Instructions</h3>
        <ol>
          <li>Téléchargez le template CSV avec les colonnes requises</li>
          <li>Remplissez vos données en respectant le format</li>
          <li>Format des tailles: <code>Taille:Stock:SKU</code> séparés par des virgules</li>
          <li>Catégories valides: jeans, maillot, chemise, tennis</li>
          <li>Importez votre fichier et vérifiez les erreurs</li>
          <li>Validez l'import une fois les données correctes</li>
        </ol>
      </div>
    </div>
  );
}