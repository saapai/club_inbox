import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { extractTextFromImage } from '@/lib/extractors/photo';
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

    if (sourceError || !source || !source.uri) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Extract text from image using OCR
    const extractedText = await extractTextFromImage(source.uri);

    if (!extractedText) {
      return NextResponse.json(
        { error: 'No text extracted from image' },
        { status: 400 }
      );
    }

    // Create evidence chunk with OCR text
    const { data: evidenceChunk, error: evidenceError } = await supabase
      .from('evidence_chunks')
      .insert({
        source_id: sourceId,
        club_id: source.club_id,
        kind: 'ocr_text',
        text: extractedText,
        crop: null,
        locator: { imageUrl: source.uri },
      })
      .select()
      .single();

    if (evidenceError) throw evidenceError;

    // Extract claims from OCR text
    const extraction = await extractClaimsFromPaste(
      extractedText,
      evidenceChunk.id,
      'Demo Club'
    );

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('club_id', source.club_id);

    const categoryMap = new Map(
      categories?.map((c) => [c.key, c.id]) || []
    );

    // Process extracted claims
    for (const category of extraction.categories) {
      const categoryId = categoryMap.get(category.category_key);
      if (!categoryId) continue;

      for (const item of category.items) {
        const signature = generateSignature(item.normalized_claim);

        // Check for duplicates
        const { data: existingClaims } = await supabase
          .from('claims')
          .select('*')
          .eq('club_id', source.club_id)
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

          if (claimError) continue;

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

    // Process unassigned items
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

    return NextResponse.json({ success: true, extractedText });
  } catch (error) {
    console.error('Error processing OCR:', error);
    return NextResponse.json(
      { error: 'Failed to process OCR' },
      { status: 500 }
    );
  }
}

