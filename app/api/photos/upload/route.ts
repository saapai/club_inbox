import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const clubId = process.env.DEFAULT_CLUB_ID || 'a0000000-0000-0000-0000-000000000001';
    const bucketName = 'claim-photos';

    // Check if bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket '${bucketName}' not found, creating...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        // Don't fail if bucket creation fails - it might already exist or user needs to create manually
        // Return a helpful error message
        return NextResponse.json(
          { 
            error: `Storage bucket '${bucketName}' not found. Please create it in your Supabase dashboard: Storage > New bucket > Name: "${bucketName}", Public: true` 
          },
          { status: 500 }
        );
      }
      console.log(`Bucket '${bucketName}' created successfully`);
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    
    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // Create source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        club_id: clubId,
        type: 'photo',
        title: title || file.name,
        uri: urlData.publicUrl,
        metadata: {
          fileName,
          fileSize: file.size,
          fileType: file.type,
        },
      })
      .select()
      .single();

    if (sourceError) throw sourceError;

    return NextResponse.json({ source, imageUrl: urlData.publicUrl });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

