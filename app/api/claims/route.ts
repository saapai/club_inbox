import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { EvidenceChunk } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const clubId = process.env.DEFAULT_CLUB_ID || 'a0000000-0000-0000-0000-000000000001';

    // Build query
    let query = supabase
      .from('claims')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: claims, error: claimsError } = await query;

    if (claimsError) throw claimsError;

    // Get evidence for each claim
    const evidenceMap: Record<string, EvidenceChunk[]> = {};
    
    if (claims && claims.length > 0) {
      const claimIds = claims.map((c) => c.id);
      
      const { data: claimEvidence } = await supabase
        .from('claim_evidence')
        .select('claim_id, evidence_chunk_id')
        .in('claim_id', claimIds);

      if (claimEvidence) {
        const evidenceChunkIds = claimEvidence.map((ce) => ce.evidence_chunk_id);
        
        const { data: evidenceChunks } = await supabase
          .from('evidence_chunks')
          .select('*')
          .in('id', evidenceChunkIds);

        // Map evidence to claims
        claimEvidence.forEach((ce) => {
          if (!evidenceMap[ce.claim_id]) {
            evidenceMap[ce.claim_id] = [];
          }
          const chunk = evidenceChunks?.find((ec) => ec.id === ce.evidence_chunk_id);
          if (chunk) {
            evidenceMap[ce.claim_id].push(chunk);
          }
        });
      }
    }

    // Calculate counts by category
    const { data: allClaims } = await supabase
      .from('claims')
      .select('category_id, status')
      .eq('club_id', clubId);

    const counts: Record<string, { total: number; disputed: number }> = {};
    
    allClaims?.forEach((claim) => {
      if (!counts[claim.category_id]) {
        counts[claim.category_id] = { total: 0, disputed: 0 };
      }
      counts[claim.category_id].total++;
      if (claim.status === 'disputed') {
        counts[claim.category_id].disputed++;
      }
    });

    return NextResponse.json({
      claims: claims || [],
      evidence: evidenceMap,
      counts,
    });
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}

