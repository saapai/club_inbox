import { NextRequest, NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/google';
import { createServerClient } from '@/lib/supabase/server';
import { extractClaimsFromSheet } from '@/lib/extractors/sheet';
import { generateSignature } from '@/lib/deduplication';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spreadsheetId, range, title } = body;

    if (!spreadsheetId || !range) {
      return NextResponse.json(
        { error: 'Missing spreadsheetId or range' },
        { status: 400 }
      );
    }

    const accessToken = request.cookies.get('google_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sheets = await getSheetsClient(accessToken);
    const supabase = createServerClient();
    const clubId = process.env.DEFAULT_CLUB_ID || 'a0000000-0000-0000-0000-000000000001';

    // Fetch sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No data found in sheet' },
        { status: 400 }
      );
    }

    // Create source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        club_id: clubId,
        type: 'google_sheet',
        title: title || 'Google Sheet Import',
        uri: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        metadata: { spreadsheetId, range },
      })
      .select()
      .single();

    if (sourceError) throw sourceError;

    // Create evidence chunks for each row
    const evidenceChunkIds: string[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const { data: chunk, error: chunkError } = await supabase
        .from('evidence_chunks')
        .insert({
          source_id: source.id,
          club_id: clubId,
          kind: 'sheet_range',
          text: row.join(' | '),
          crop: null,
          locator: {
            spreadsheetId,
            range: `${range.split('!')[0]}!A${i + 1}:Z${i + 1}`,
            row: i + 1,
          },
        })
        .select()
        .single();

      if (!chunkError && chunk) {
        evidenceChunkIds.push(chunk.id);
      }
    }

    // Extract claims
    const extraction = await extractClaimsFromSheet(
      rows as string[][],
      evidenceChunkIds,
      'Demo Club'
    );

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('club_id', clubId);

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
          .eq('club_id', clubId)
          .eq('category_id', categoryId)
          .eq('signature', signature);

        if (existingClaims && existingClaims.length > 0) {
          // Link evidence to existing claim
          const existingClaim = existingClaims[0];
          
          for (const evidenceId of item.evidence_refs) {
            await supabase.from('claim_evidence').insert({
              claim_id: existingClaim.id,
              evidence_chunk_id: evidenceId,
              weight: 1.0,
            });
          }

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

          if (claimError) continue;

          // Link evidence
          for (const evidenceId of item.evidence_refs) {
            await supabase.from('claim_evidence').insert({
              claim_id: newClaim.id,
              evidence_chunk_id: evidenceId,
              weight: 1.0,
            });
          }

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

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error('Error importing sheet:', error);
    return NextResponse.json(
      { error: 'Failed to import sheet' },
      { status: 500 }
    );
  }
}

