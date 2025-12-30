import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { extractClaimsFromMatrix } from '@/lib/extractors/matrix';
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

    if (sourceError || !source || !source.uri) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Extract clubs and claims from matrix image
    const extraction = await extractClaimsFromMatrix(source.uri);

    if (!extraction.clubs || extraction.clubs.length === 0) {
      return NextResponse.json(
        { error: 'No clubs detected in image' },
        { status: 400 }
      );
    }

    // Create or get clubs
    const clubMap = new Map<string, string>();
    
    for (const clubData of extraction.clubs) {
      // Check if club already exists
      const { data: existingClub } = await supabase
        .from('clubs')
        .select('id')
        .eq('name', clubData.name)
        .single();

      if (existingClub) {
        clubMap.set(clubData.name, existingClub.id);
      } else {
        // Create new club
        const { data: newClub, error: clubError } = await supabase
          .from('clubs')
          .insert({
            name: clubData.name,
            owner_user_id: null,
          })
          .select()
          .single();

        if (clubError) {
          console.error('Error creating club:', clubError);
          continue;
        }

        clubMap.set(clubData.name, newClub.id);

        // Create default categories for this club
        const { data: globalCategories } = await supabase
          .from('categories')
          .select('*')
          .is('club_id', null);

        if (globalCategories) {
          const clubCategories = globalCategories.map((cat) => ({
            club_id: newClub.id,
            key: cat.key,
            label: cat.label,
            order_index: cat.order_index,
          }));

          await supabase.from('categories').insert(clubCategories);
        }
      }
    }

    // Process claims for each club
    for (const [clubName, clubData] of Object.entries(extraction.claims_by_club)) {
      const clubId = clubMap.get(clubName);
      if (!clubId) continue;

      // Create evidence chunk for this club
      const { data: evidenceChunk, error: evidenceError } = await supabase
        .from('evidence_chunks')
        .insert({
          source_id: sourceId,
          club_id: clubId,
          kind: 'ocr_text',
          text: `Matrix data for ${clubName}`,
          crop: null,
          locator: { imageUrl: source.uri, clubName },
        })
        .select()
        .single();

      if (evidenceError) {
        console.error('Error creating evidence chunk:', evidenceError);
        continue;
      }

      // Get categories for this club
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('club_id', clubId);

      const categoryMap = new Map(
        categories?.map((c) => [c.key, c.id]) || []
      );

      // Process extracted claims
      for (const category of clubData.categories) {
        const categoryId = categoryMap.get(category.category_key);
        if (!categoryId) continue;

        for (const item of category.items) {
          const signature = generateSignature(item.normalized_claim);

          // Check for duplicates
          const { data: existingClaims } = await supabase
            .from('claims')
            .select('*')
            .eq('club_id', clubId)
            .eq('category_id', categoryId)
            .eq('signature', signature);

          if (existingClaims && existingClaims.length > 0) {
            const existingClaim = existingClaims[0];
            
            await supabase.from('claim_evidence').insert({
              claim_id: existingClaim.id,
              evidence_chunk_id: evidenceChunk.id,
              weight: 1.0,
            });

            await supabase
              .from('claims')
              .update({
                confidence: 'high',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingClaim.id);
          } else {
            const { data: newClaim, error: claimError } = await supabase
              .from('claims')
              .insert({
                club_id: clubId,
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

            await supabase.from('claim_evidence').insert({
              claim_id: newClaim.id,
              evidence_chunk_id: evidenceChunk.id,
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
    }

    return NextResponse.json({ 
      success: true, 
      clubsCreated: extraction.clubs.length,
      clubs: extraction.clubs.map(c => c.name),
    });
  } catch (error) {
    console.error('Error processing OCR:', error);
    return NextResponse.json(
      { error: 'Failed to process OCR' },
      { status: 500 }
    );
  }
}

