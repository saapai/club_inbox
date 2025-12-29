import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateSignature } from '@/lib/deduplication';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claim_ids, canonical_text } = body;

    if (!claim_ids || claim_ids.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 claims to merge' },
        { status: 400 }
      );
    }

    if (!canonical_text) {
      return NextResponse.json(
        { error: 'Missing canonical_text' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get all claims to merge
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select('*')
      .in('id', claim_ids);

    if (claimsError || !claims || claims.length < 2) {
      return NextResponse.json({ error: 'Claims not found' }, { status: 404 });
    }

    // Use the first claim as the base
    const primaryClaim = claims[0];
    const secondaryClaims = claims.slice(1);

    // Collect all evidence from all claims
    const { data: allEvidence } = await supabase
      .from('claim_evidence')
      .select('evidence_chunk_id, weight')
      .in('claim_id', claim_ids);

    // Merge structured data (combine fields)
    const mergedStructured = claims.reduce((acc, claim) => {
      return { ...acc, ...(claim.structured || {}) };
    }, {});

    // Update primary claim with merged data
    const signature = generateSignature(canonical_text);
    const { data: updatedClaim, error: updateError } = await supabase
      .from('claims')
      .update({
        canonical_text,
        structured: mergedStructured,
        signature,
        confidence: 'high', // Merged claims have high confidence
        updated_at: new Date().toISOString(),
      })
      .eq('id', primaryClaim.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Delete old evidence links for primary claim
    await supabase
      .from('claim_evidence')
      .delete()
      .eq('claim_id', primaryClaim.id);

    // Add all evidence to primary claim (dedupe by evidence_chunk_id)
    const uniqueEvidence = Array.from(
      new Map(allEvidence?.map((e) => [e.evidence_chunk_id, e]) || []).values()
    );

    for (const evidence of uniqueEvidence) {
      await supabase.from('claim_evidence').insert({
        claim_id: primaryClaim.id,
        evidence_chunk_id: evidence.evidence_chunk_id,
        weight: evidence.weight,
      });
    }

    // Log history for primary claim
    await supabase.from('claim_history').insert({
      claim_id: primaryClaim.id,
      actor_user_id: null,
      action: 'merge',
      before: {
        canonical_text: primaryClaim.canonical_text,
        merged_from: secondaryClaims.map((c) => c.id),
      },
      after: {
        canonical_text,
        evidence_count: uniqueEvidence.length,
      },
    });

    // Delete secondary claims
    for (const claim of secondaryClaims) {
      await supabase.from('claims').delete().eq('id', claim.id);
    }

    return NextResponse.json({ claim: updatedClaim });
  } catch (error) {
    console.error('Error merging claims:', error);
    return NextResponse.json(
      { error: 'Failed to merge claims' },
      { status: 500 }
    );
  }
}

