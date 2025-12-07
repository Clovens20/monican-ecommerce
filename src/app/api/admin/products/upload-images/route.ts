import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * POST /api/admin/products/upload-images
 * Upload des images de produits vers Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé. Vous devez être administrateur.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune image fournie' },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: `Le fichier ${file.name} n'est pas une image` },
          { status: 400 }
        );
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `L'image ${file.name} est trop grande (max 5MB)` },
          { status: 400 }
        );
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop();
      const fileName = `products/${timestamp}-${randomString}.${fileExt}`;

      // Convertir le fichier en buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload vers Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('product-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: `Erreur lors de l'upload de ${file.name}: ${error.message || 'Erreur inconnue'}`,
            // ✅ FIX: Suppression de statusCode qui n'existe pas sur StorageError
            details: process.env.NODE_ENV === 'development' ? {
              message: error.message,
              error: error
            } : undefined
          },
          { status: 500 }
        );
      }

      // Obtenir l'URL publique de l'image
      const { data: urlData } = supabaseAdmin.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      } else {
        // Fallback: construire l'URL manuellement
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          uploadedUrls.push(`${supabaseUrl}/storage/v1/object/public/product-images/${fileName}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error: any) {
    console.error('Unexpected error in image upload:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de l\'upload des images',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}