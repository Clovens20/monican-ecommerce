import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAllOrders } from '@/lib/orders-db';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const CreateSubAdminSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  role: z.literal('subadmin'),
});

/**
 * ✅ CORRECTION 8: Génère un code unique pour un sous-admin de manière optimisée
 * Récupère tous les codes existants en une seule requête au lieu de multiples requêtes
 */
async function generateUniqueSubAdminCode(supabaseAdmin: any): Promise<string | null> {
  try {
    // Récupérer tous les codes existants en une seule requête
    const { data: existingCodes, error } = await supabaseAdmin
      .from('user_profiles')
      .select('subadmin_code')
      .not('subadmin_code', 'is', null)
      .order('subadmin_code', { ascending: true });

    if (error) {
      console.error('Error fetching existing codes:', error);
      throw error;
    }

    // Créer un Set des codes utilisés pour recherche rapide O(1)
    const usedCodes = new Set(
      existingCodes?.map((profile: any) => profile.subadmin_code) || []
    );

    // Chercher le premier code disponible
    let counter = 1;
    let candidateCode: string;

    // Limite raisonnable: 9999 sous-admins maximum
    while (counter <= 9999) {
      candidateCode = `MON-${String(counter).padStart(3, '0')}`;

      // Si le code n'est pas utilisé, on l'a trouvé
      if (!usedCodes.has(candidateCode)) {
        console.log(`✅ Code unique généré: ${candidateCode}`);
        return candidateCode;
      }

      counter++;
    }

    // Tous les codes sont utilisés (peu probable)
    console.error('❌ Tous les codes MON-XXX sont utilisés (9999 max)');
    return null;

  } catch (error) {
    console.error('Error generating unique code:', error);
    return null;
  }
}

/**
 * Route pour récupérer tous les utilisateurs (admins et sous-admins)
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer tous les utilisateurs avec rôle admin ou subadmin
    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name, role, subadmin_code, is_active, created_at')
      .in('role', ['admin', 'subadmin'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      );
    }
    
    // Récupérer toutes les commandes pour calculer les statistiques
    const orders = await getAllOrders();
    
    // Enrichir les données avec les statistiques
    const usersWithStats = users.map(user => {
      // Pour les sous-admins, compter les commandes traitées
      let ordersProcessed = 0;
      if (user.role === 'subadmin') {
        // Compter les commandes avec ce sous-admin (si vous avez un champ assigned_to)
        ordersProcessed = orders.filter(o => {
          // Vous pouvez ajouter une logique pour associer les commandes aux sous-admins
          return false; // Pour l'instant, retourner 0
        }).length;
      }
      
      return {
        id: user.id,
        code: user.subadmin_code || null,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.is_active,
        ordersProcessed,
        createdAt: user.created_at
      };
    });
    
    return NextResponse.json({
      success: true,
      users: usersWithStats
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * Route pour créer un sous-admin
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAuth(request);
    
    if (authResult.status !== 200) {
      console.error('Auth verification failed:', {
        status: authResult.status,
        error: authResult.error,
        hasCookie: !!request.cookies.get('admin_token'),
        cookieValue: request.cookies.get('admin_token')?.value?.substring(0, 20) + '...'
      });
      
      let errorMessage = 'Non autorisé';
      if (authResult.status === 401) {
        errorMessage = authResult.error || 'Vous devez être connecté en tant qu\'administrateur pour effectuer cette action. Veuillez vous reconnecter.';
      } else if (authResult.status === 403) {
        errorMessage = authResult.error || 'Accès refusé. Vérifiez que votre compte est actif et que vous avez les permissions nécessaires.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: authResult.error,
          status: authResult.status
        },
        { status: authResult.status }
      );
    }
    
    if (!authResult.user || authResult.user.role !== 'admin') {
      console.error('User is not admin:', {
        userId: authResult.user?.id,
        role: authResult.user?.role
      });
      return NextResponse.json(
        { 
          error: 'Accès refusé. Seuls les administrateurs peuvent créer des sous-admins.',
          details: `Rôle actuel: ${authResult.user?.role || 'non défini'}`
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Valider les données
    const validationResult = CreateSubAdminSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, email } = validationResult.data;

    // Vérifier si l'email existe déjà dans user_profiles
    const { data: existingUser } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà dans auth.users
    try {
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (!listError && authUsers?.users) {
        const existingAuthUser = authUsers.users.find(u => u.email === email);
        if (existingAuthUser) {
          return NextResponse.json(
            { error: 'Cet email est déjà utilisé dans le système d\'authentification' },
            { status: 400 }
          );
        }
      }
    } catch (checkError) {
      console.warn('Could not check existing auth users:', checkError);
      // Continuer même si on ne peut pas vérifier
    }

    // Générer un code unique pour le sous-admin au format MON-XXX
    // Récupérer tous les codes MON-XXX existants pour trouver le prochain numéro disponible
    const { data: existingCodes } = await supabaseAdmin
      .from('user_profiles')
      .select('subadmin_code')
      .eq('role', 'subadmin')
      .not('subadmin_code', 'is', null)
      .like('subadmin_code', 'MON-%');

    let subAdminCode: string | null;
    
    if (existingCodes && existingCodes.length > 0) {
      // Extraire tous les numéros des codes MON-XXX existants
      const numbers = existingCodes
        .map(code => {
          const match = code.subadmin_code?.match(/MON-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0)
        .sort((a, b) => b - a); // Trier par ordre décroissant

      // Trouver le prochain numéro disponible
      let nextNumber = 1;
      if (numbers.length > 0) {
        const maxNumber = numbers[0];
        // Chercher le premier trou dans la séquence ou utiliser maxNumber + 1
        for (let i = 1; i <= maxNumber + 1; i++) {
          if (!numbers.includes(i)) {
            nextNumber = i;
            break;
          }
        }
      }
      
      subAdminCode = `MON-${String(nextNumber).padStart(3, '0')}`;
    } else {
      // Aucun code MON-XXX existant, commencer à MON-001
      subAdminCode = 'MON-001';
    }

    // ✅ CORRECTION 8: Optimisation de la génération de code unique
    // Vérifier une dernière fois que le code est unique (sécurité supplémentaire)
    const { data: codeCheck } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('subadmin_code', subAdminCode)
      .single();

    if (codeCheck) {
      // Si le code existe quand même, utiliser la fonction optimisée
      subAdminCode = await generateUniqueSubAdminCode(supabaseAdmin);
      
      if (!subAdminCode) {
        return NextResponse.json(
          { error: 'Impossible de générer un code unique. Trop de sous-admins existants.' },
          { status: 500 }
        );
      }
    }

    // Vérifier que subAdminCode n'est pas null avant de continuer
    if (!subAdminCode) {
      return NextResponse.json(
        { error: 'Impossible de générer un code unique. Trop de sous-admins existants.' },
        { status: 500 }
      );
    }

    // Vérifier que la clé service role est bien configurée
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey === 'placeholder-service-role-key' || serviceRoleKey.length < 50) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not properly configured');
      return NextResponse.json(
        { 
          error: 'Configuration serveur manquante',
          details: 'La clé service role Supabase n\'est pas configurée correctement. Vérifiez votre fichier .env.local'
        },
        { status: 500 }
      );
    }

    // Créer d'abord un utilisateur dans auth.users (requis pour la contrainte de clé étrangère)
    // On génère un mot de passe aléatoire car les sous-admins utilisent un code pour se connecter
    // Le mot de passe doit respecter les règles de Supabase (min 6 caractères, avec majuscule, minuscule, chiffre)
    const randomPassword = `SubAdmin${crypto.randomUUID().replace(/-/g, '')}123!`; // Mot de passe aléatoire sécurisé
    
    let authUser;
    let authError;
    
    try {
      console.log('Creating auth user for email:', email);
      const result = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(), // Normaliser l'email
        password: randomPassword, // Mot de passe aléatoire (non utilisé car connexion par code)
        email_confirm: true, // Auto-confirmer l'email
        user_metadata: {
          name: name,
          role: 'subadmin',
        },
      });
      
      authUser = result.data;
      authError = result.error;
      
      if (authError) {
        console.error('Supabase auth error:', JSON.stringify(authError, null, 2));
      }
    } catch (err: any) {
      console.error('Exception creating auth user:', err);
      authError = err;
    }

    if (authError || !authUser?.user) {
      console.error('Error creating auth user:', authError);
      console.error('Error details:', JSON.stringify(authError, null, 2));
      
      // Messages d'erreur plus détaillés
      let errorMessage = 'Erreur lors de la création de l\'utilisateur d\'authentification';
      let statusCode = 500;
      
      if (authError) {
        const errorMsg = authError.message || String(authError);
        const errorStatus = authError.status || 500;
        
        if (errorMsg.includes('already registered') || 
            errorMsg.includes('already exists') || 
            errorMsg.includes('User already registered')) {
          errorMessage = 'Cet email est déjà enregistré dans le système d\'authentification';
          statusCode = 400;
        } else if (errorMsg.includes('not allowed') || 
                   errorMsg.includes('permission denied') || 
                   errorMsg.includes('Forbidden') ||
                   errorStatus === 403) {
          errorMessage = 'Permissions insuffisantes. Vérifiez que la clé service role Supabase (SUPABASE_SERVICE_ROLE_KEY) est correctement configurée dans votre fichier .env.local';
          statusCode = 403;
        } else if (errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
          errorMessage = `Email invalide: ${email}`;
          statusCode = 400;
        } else if (errorMsg.includes('password')) {
          errorMessage = 'Erreur de génération du mot de passe';
          statusCode = 500;
        } else {
          errorMessage = `Erreur d'authentification: ${errorMsg}`;
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: authError?.message || authError?.toString() || 'Erreur inconnue',
          code: authError?.status || 'UNKNOWN_ERROR',
          email: email
        },
        { status: statusCode }
      );
    }

    // Créer le profil utilisateur avec l'ID de l'utilisateur auth créé
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.user.id, // Utiliser l'ID de l'utilisateur auth créé
        email,
        name,
        role: 'subadmin',
        subadmin_code: subAdminCode,
        is_active: true,
        assigned_by: authResult.user.id, // ID de l'admin qui crée
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating subadmin profile:', insertError);
      // Si l'insertion du profil échoue, supprimer l'utilisateur auth créé
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil sous-admin', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        code: newUser.subadmin_code,
        role: newUser.role,
      },
      message: 'Sous-admin créé avec succès',
    });

  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

