import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { normalizeCategoryKey } from '@/lib/categories';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const clubId = process.env.DEFAULT_CLUB_ID || 'a0000000-0000-0000-0000-000000000001';

    // Fetch all clubs (excluding Demo Club if other clubs exist)
    const { data: clubsData } = await supabase
      .from('clubs')
      .select('id, name')
      .order('name');
    
    let clubs = clubsData && clubsData.length > 0 
      ? clubsData 
      : [{ id: clubId, name: 'Demo Club' }];
    
    // If there are real clubs besides Demo Club, exclude Demo Club
    if (clubs.length > 1) {
      clubs = clubs.filter(c => c.name !== 'Demo Club');
    }

    // Fetch categories for all clubs
    const clubIds = clubs.map(c => c.id);
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, key, label, club_id')
      .in('club_id', clubIds)
      .order('order_index');

    if (categoriesError) throw categoriesError;

    // Fetch claims for all clubs
    let query = supabase
      .from('claims')
      .select('*')
      .in('club_id', clubIds)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: claims, error: claimsError } = await query;

    if (claimsError) throw claimsError;

    // Get sources_count for each claim
    const claimIds = claims?.map((c) => c.id) || [];
    const sourcesCountMap: Record<string, number> = {};
    
    if (claimIds.length > 0) {
      const { data: claimEvidence } = await supabase
        .from('claim_evidence')
        .select('claim_id')
        .in('claim_id', claimIds);

      if (claimEvidence) {
        claimEvidence.forEach((ce) => {
          sourcesCountMap[ce.claim_id] = (sourcesCountMap[ce.claim_id] || 0) + 1;
        });
      }
    }

    // Add category_key and sources_count to claims
    const claimsWithKeys = (claims || []).map((claim) => {
      const category = categories?.find((c) => c.id === claim.category_id);
      const categoryKey = category?.key ? normalizeCategoryKey(category.key) : 'attendance';
      return {
        ...claim,
        category_key: categoryKey,
        sources_count: sourcesCountMap[claim.id] || 0,
      };
    });

    return NextResponse.json({
      clubs,
      categories: categories || [],
      claims: claimsWithKeys,
    });
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}

