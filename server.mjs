import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middleware pour parser les requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Config Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Erreur: Variables d'environnement Supabase manquantes");
  console.error("   SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * NOTE: La route OAuth Square a été supprimée.
 * Square est maintenant configuré directement via les variables d'environnement:
 * - SQUARE_ACCESS_TOKEN
 * - SQUARE_LOCATION_ID
 * - SQUARE_ENVIRONMENT
 */

// Route de santé pour vérifier que le serveur fonctionne
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Monican E-commerce Server"
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée",
    message: `La route ${req.method} ${req.path} n'existe pas`
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error("❌ Erreur globale:", err);
  res.status(500).json({
    success: false,
    error: "Erreur serveur",
    message: "Une erreur inattendue s'est produite"
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Serveur Express démarré sur http://${HOST}:${PORT}`);
  console.log(`📋 Routes disponibles:`);
  console.log(`   GET  /health - Vérification de santé`);
  console.log(`\n✅ Variables d'environnement:`);
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`);
  console.log(`   SQUARE_ACCESS_TOKEN: ${process.env.SQUARE_ACCESS_TOKEN ? '✓' : '✗'}`);
  console.log(`   SQUARE_LOCATION_ID: ${process.env.SQUARE_LOCATION_ID ? '✓' : '✗'}`);
});

