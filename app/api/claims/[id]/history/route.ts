import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const supabase = createServerClient();

    const { data: history, error } = await supabase
      .from('claim_history')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error('Error fetching claim history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim history' },
      { status: 500 }
    );
  }
}

