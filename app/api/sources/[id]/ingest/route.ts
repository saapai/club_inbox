import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { extractClaimsFromPaste } from '@/lib/extractors/paste';
import { generateSignature } from '@/lib/deduplication';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceId } = await params;
    const supabase = createServerClient();

    // Get source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Get evidence chunks for this source
    const { data: evidenceChunks, error: evidenceError } = await supabase
      .from('evidence_chunks')
      .select('*')
      .eq('source_id', sourceId);

    if (evidenceError) throw evidenceError;

    if (!evidenceChunks || evidenceChunks.length === 0) {
      return NextResponse.json(
        { error: 'No evidence chunks found' },
        { status: 400 }
      );
    }

    // Get categories for this club
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('club_id', source.club_id);

    if (categoriesError) throw categoriesError;

    const categoryMap = new Map(
      categories?.map((c) => [c.key, c.id]) || []
    );

    // Extract claims from each evidence chunk
    for (const chunk of evidenceChunks) {
      if (!chunk.text) continue;

      const extraction = await extractClaimsFromPaste(
        chunk.text,
        chunk.id,
        'Demo Club'
      );

      // Process extracted claims
      for (const category of extraction.categories) {
        const categoryId = categoryMap.get(category.category_key);
        if (!categoryId) continue;

        for (const item of category.items) {
          const signature = generateSignature(item.normalized_claim);

          // Check for existing claim with same signature
          const { data: existingClaims } = await supabase
            .from('claims')
            .select('*')
            .eq('club_id', source.club_id)
            .eq('category_id', categoryId)
            .eq('signature', signature);

          if (existingClaims && existingClaims.length > 0) {
            // Claim already exists, just link evidence
            const existingClaim = existingClaims[0];
            
            await supabase.from('claim_evidence').insert({
              claim_id: existingClaim.id,
              evidence_chunk_id: chunk.id,
              weight: 1.0,
            });

            // Update confidence if multiple sources
            await supabase
              .from('claims')
              .update({
                confidence: 'high',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingClaim.id);
          } else {
            // Create new claim
            const { data: newClaim, error: claimError } = await supabase
              .from('claims')
              .insert({
                club_id: source.club_id,
                category_id: categoryId,
                canonical_text: item.normalized_claim,
                structured: item.structured || {},
                status: 'unreviewed',
                confidence: item.confidence || 'medium',
                signature,
                last_verified_at: null,
              })
              .select()
              .single();

            if (claimError) {
              console.error('Error creating claim:', claimError);
              continue;
            }

            // Link evidence
            await supabase.from('claim_evidence').insert({
              claim_id: newClaim.id,
              evidence_chunk_id: chunk.id,
              weight: 1.0,
            });

            // Log history
            await supabase.from('claim_history').insert({
              claim_id: newClaim.id,
              actor_user_id: null,
              action: 'create',
              before: null,
              after: {
                canonical_text: newClaim.canonical_text,
                status: newClaim.status,
              },
            });
          }
        }
      }

      // Process unassigned items (put in 'admin' category as fallback)
      const adminCategoryId = categoryMap.get('admin');
      if (adminCategoryId) {
        for (const item of extraction.unassigned_items) {
          const signature = generateSignature(item.normalized_claim);

          const { data: newClaim, error: claimError } = await supabase
            .from('claims')
            .insert({
              club_id: source.club_id,
              category_id: adminCategoryId,
              canonical_text: item.normalized_claim,
              structured: item.structured || {},
              status: 'unreviewed',
              confidence: 'low',
              signature,
              last_verified_at: null,
            })
            .select()
            .single();

          if (claimError) continue;

          await supabase.from('claim_evidence').insert({
            claim_id: newClaim.id,
            evidence_chunk_id: chunk.id,
            weight: 1.0,
          });

          await supabase.from('claim_history').insert({
            claim_id: newClaim.id,
            actor_user_id: null,
            action: 'create',
            before: null,
            after: {
              canonical_text: newClaim.canonical_text,
              status: newClaim.status,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ingesting source:', error);
    return NextResponse.json(
      { error: 'Failed to ingest source' },
      { status: 500 }
    );
  }
}

