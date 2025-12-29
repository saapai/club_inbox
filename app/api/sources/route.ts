import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, text } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    
    // Get default club ID
    const clubId = process.env.DEFAULT_CLUB_ID || 'a0000000-0000-0000-0000-000000000001';

    // Create source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        club_id: clubId,
        type,
        title,
        uri: null,
        metadata: {},
      })
      .select()
      .single();

    if (sourceError) throw sourceError;

    // Create evidence chunk for paste type
    if (type === 'paste' && text) {
      const { error: evidenceError } = await supabase
        .from('evidence_chunks')
        .insert({
          source_id: source.id,
          club_id: clubId,
          kind: 'pasted_chunk',
          text,
          crop: null,
          locator: null,
        });

      if (evidenceError) throw evidenceError;
    }

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    );
  }
}

