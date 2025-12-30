import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const supabase = createServerClient();

    // Get evidence chunks for this claim
    const { data: claimEvidence } = await supabase
      .from('claim_evidence')
      .select('evidence_chunk_id')
      .eq('claim_id', claimId);

    if (!claimEvidence || claimEvidence.length === 0) {
      return NextResponse.json({ evidence: [] });
    }

    const evidenceChunkIds = claimEvidence.map((ce) => ce.evidence_chunk_id);
    
    const { data: evidenceChunks, error } = await supabase
      .from('evidence_chunks')
      .select('*')
      .in('id', evidenceChunkIds);

    if (error) throw error;

    return NextResponse.json({ evidence: evidenceChunks || [] });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
      { status: 500 }
    );
  }
}

