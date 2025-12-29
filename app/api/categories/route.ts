import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Get default club ID from env or use the demo club
    const clubId = process.env.DEFAULT_CLUB_ID || 'a0000000-0000-0000-0000-000000000001';
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('club_id', clubId)
      .order('order_index');

    if (error) throw error;

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

