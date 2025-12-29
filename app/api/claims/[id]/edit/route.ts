import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateSignature } from '@/lib/deduplication';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const body = await request.json();
    const { canonical_text, structured } = body;

    if (!canonical_text) {
      return NextResponse.json(
        { error: 'Missing canonical_text' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get current claim
    const { data: currentClaim, error: fetchError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (fetchError || !currentClaim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Generate new signature
    const signature = generateSignature(canonical_text);

    // Update claim
    const updateData: Record<string, unknown> = {
      canonical_text,
      signature,
      updated_at: new Date().toISOString(),
    };

    if (structured !== undefined) {
      updateData.structured = structured;
    }

    const { data: updatedClaim, error: updateError } = await supabase
      .from('claims')
      .update(updateData)
      .eq('id', claimId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log history
    await supabase.from('claim_history').insert({
      claim_id: claimId,
      actor_user_id: null,
      action: 'edit',
      before: {
        canonical_text: currentClaim.canonical_text,
        structured: currentClaim.structured,
      },
      after: {
        canonical_text,
        structured: structured || currentClaim.structured,
      },
    });

    return NextResponse.json({ claim: updatedClaim });
  } catch (error) {
    console.error('Error editing claim:', error);
    return NextResponse.json(
      { error: 'Failed to edit claim' },
      { status: 500 }
    );
  }
}

