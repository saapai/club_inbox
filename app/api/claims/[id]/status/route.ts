import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['unreviewed', 'accepted', 'disputed', 'outdated'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
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

    // Update claim
    const { data: updatedClaim, error: updateError } = await supabase
      .from('claims')
      .update({
        status,
        last_verified_at: status === 'accepted' ? new Date().toISOString() : currentClaim.last_verified_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log history
    await supabase.from('claim_history').insert({
      claim_id: claimId,
      actor_user_id: null,
      action: 'status_change',
      before: { status: currentClaim.status },
      after: { status },
    });

    return NextResponse.json({ claim: updatedClaim });
  } catch (error) {
    console.error('Error updating claim status:', error);
    return NextResponse.json(
      { error: 'Failed to update claim status' },
      { status: 500 }
    );
  }
}

