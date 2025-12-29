import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateSignature } from '@/lib/deduplication';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claim_id, split_texts } = body;

    if (!claim_id || !split_texts || split_texts.length < 2) {
      return NextResponse.json(
        { error: 'Need claim_id and at least 2 split_texts' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get original claim
    const { data: originalClaim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claim_id)
      .single();

    if (claimError || !originalClaim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Get evidence for original claim
    const { data: evidence } = await supabase
      .from('claim_evidence')
      .select('evidence_chunk_id, weight')
      .eq('claim_id', claim_id);

    const newClaims = [];

    // Create new claims for each split text
    for (const text of split_texts) {
      const signature = generateSignature(text);

      const { data: newClaim, error: createError } = await supabase
        .from('claims')
        .insert({
          club_id: originalClaim.club_id,
          category_id: originalClaim.category_id,
          canonical_text: text,
          structured: originalClaim.structured,
          status: 'unreviewed',
          confidence: 'medium',
          signature,
          last_verified_at: null,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating split claim:', createError);
        continue;
      }

      // Copy evidence to new claim
      if (evidence) {
        for (const ev of evidence) {
          await supabase.from('claim_evidence').insert({
            claim_id: newClaim.id,
            evidence_chunk_id: ev.evidence_chunk_id,
            weight: ev.weight,
          });
        }
      }

      // Log history for new claim
      await supabase.from('claim_history').insert({
        claim_id: newClaim.id,
        actor_user_id: null,
        action: 'split',
        before: null,
        after: {
          canonical_text: text,
          split_from: claim_id,
        },
      });

      newClaims.push(newClaim);
    }

    // Delete original claim
    await supabase.from('claims').delete().eq('id', claim_id);

    return NextResponse.json({ claims: newClaims });
  } catch (error) {
    console.error('Error splitting claim:', error);
    return NextResponse.json(
      { error: 'Failed to split claim' },
      { status: 500 }
    );
  }
}

