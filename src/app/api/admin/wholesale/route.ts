import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/admin/wholesale
 * Liste les demandes wholesale (admin uniquement)
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request);
        const role = authResult.user?.role;
        if (authResult.status !== 200 || (role !== 'admin' && role !== 'subadmin')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

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
        console.error('Error in admin wholesale API:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
