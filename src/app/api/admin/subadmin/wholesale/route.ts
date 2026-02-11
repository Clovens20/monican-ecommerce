import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/subadmin/wholesale
 * Liste les demandes wholesale pour les sous-admins (même logique que l'admin)
 */
export async function GET(request: NextRequest) {
    try {
        const { data: orders, error } = await supabaseAdmin
            .from('wholesale_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching wholesale orders:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des demandes' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            orders: orders || [],
        });
    } catch (error) {
        console.error('Error in subadmin wholesale API:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
