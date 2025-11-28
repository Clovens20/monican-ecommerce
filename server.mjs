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
 * Route GET /oauth/callback
 * Gère le flux OAuth de Square et insère le token dans la table square_tokens
 */
app.get("/oauth/callback", async (req, res) => {
  const { code, state, error } = req.query;

  // Vérifier s'il y a une erreur dans la réponse OAuth
  if (error) {
    console.error("❌ Erreur OAuth Square:", error);
    return res.status(400).json({
      success: false,
      error: `Erreur OAuth: ${error}`,
      message: "Impossible de connecter le compte Square"
    });
  }

  // Vérifier que le code et le state sont présents
  if (!code || !state) {
    console.error("❌ Paramètres manquants:", { code: !!code, state: !!state });
    return res.status(400).json({
      success: false,
      error: "Paramètres manquants",
      message: "Le code d'autorisation et l'état sont requis"
    });
  }

  // Extraire l'ID utilisateur du state (format: userId-timestamp)
  const userId = state.split('-')[0];
  
  if (!userId) {
    console.error("❌ State invalide:", state);
    return res.status(400).json({
      success: false,
      error: "État invalide",
      message: "L'état de sécurité est invalide. Veuillez réessayer."
    });
  }

  // Vérifier que les credentials Square sont configurés
  const clientId = process.env.SQUARE_CLIENT_ID;
  const clientSecret = process.env.SQUARE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ Credentials Square non configurés");
    return res.status(500).json({
      success: false,
      error: "Configuration serveur manquante",
      message: "Les identifiants Square ne sont pas configurés sur le serveur"
    });
  }

  try {
    // Échanger le code contre un access_token
    // Square utilise application/x-www-form-urlencoded pour OAuth
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');

    const tokenResponse = await fetch('https://connect.squareup.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Square-Version': '2023-10-18',
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Erreur lors de l'échange du token:", errorText);
      return res.status(400).json({
        success: false,
        error: "Échec de l'échange du token",
        message: "Impossible d'obtenir un token d'accès depuis Square",
        details: errorText
      });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_at, token_type, merchant_id } = tokenData;

    if (!access_token) {
      console.error("❌ Aucun access_token dans la réponse:", tokenData);
      return res.status(400).json({
        success: false,
        error: "Token manquant",
        message: "Aucun token d'accès reçu de Square"
      });
    }

    // Récupérer le merchant_id si non fourni dans la réponse
    let finalMerchantId = merchant_id;
    if (!finalMerchantId && access_token) {
      try {
        // Appel API Square pour récupérer les informations du marchand
        const merchantResponse = await fetch('https://connect.squareup.com/v2/merchants/me', {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Square-Version': '2023-10-18',
          },
        });

        if (merchantResponse.ok) {
          const merchantData = await merchantResponse.json();
          // Square retourne un tableau de merchants, on prend le premier
          if (merchantData.merchant && merchantData.merchant.length > 0) {
            finalMerchantId = merchantData.merchant[0].id;
          }
        }
      } catch (err) {
        console.warn("⚠️ Impossible de récupérer le merchant_id, continuation sans:", err);
      }
    }

    // Convertir expires_at en Date si c'est une string ISO ou un timestamp
    let expiresAtDate = null;
    if (expires_at) {
      if (typeof expires_at === 'string') {
        expiresAtDate = new Date(expires_at);
      } else if (typeof expires_at === 'number') {
        expiresAtDate = new Date(expires_at * 1000); // Si c'est un timestamp Unix
      }
    }

    // Insérer les tokens dans la table square_tokens
    // Utiliser upsert pour mettre à jour si le token existe déjà
    const { data, error: dbError } = await supabase
      .from('square_tokens')
      .upsert({
        user_id: userId,
        access_token: access_token,
        refresh_token: refresh_token || null,
        expires_at: expiresAtDate?.toISOString() || null,
        token_type: token_type || 'Bearer',
        merchant_id: finalMerchantId || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ Erreur lors de l'insertion dans Supabase:", dbError);
      return res.status(500).json({
        success: false,
        error: "Erreur base de données",
        message: "Erreur lors du stockage du token en base de données",
        details: dbError.message
      });
    }

    console.log("✅ Token Square stocké avec succès pour l'utilisateur:", userId);

    // Succès
    return res.status(200).json({
      success: true,
      message: "Compte Square connecté avec succès !",
      data: {
        user_id: userId,
        merchant_id: finalMerchantId,
        expires_at: expiresAtDate?.toISOString() || null
      }
    });

  } catch (err) {
    console.error("❌ Erreur inattendue:", err);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
      message: "Une erreur inattendue s'est produite lors de la connexion à Square",
      details: err.message
    });
  }
});

// Route de santé pour vérifier que le serveur fonctionne
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Square OAuth Callback Server"
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
const clientId = process.env.SQUARE_CLIENT_ID;

app.listen(PORT, HOST, () => {
  console.log(`🚀 Serveur Express démarré sur http://${HOST}:${PORT}`);
  console.log(`📋 Routes disponibles:`);
  console.log(`   GET  /oauth/callback - Callback OAuth Square`);
  console.log(`   GET  /health - Vérification de santé`);
  console.log(`\n✅ Variables d'environnement:`);
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`);
  console.log(`   SQUARE_CLIENT_ID: ${clientId ? '✓' : '✗'}`);
  console.log(`   SQUARE_CLIENT_SECRET: ${process.env.SQUARE_CLIENT_SECRET ? '✓' : '✗'}`);
});

