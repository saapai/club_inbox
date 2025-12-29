import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}?error=no_code`
      );
    }

    const tokens = await getTokensFromCode(code);

    // Store tokens in session/cookie (simplified for MVP)
    // In production, you'd want to store this securely
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?sheets_connected=true`
    );
    
    // Set access token in cookie (httpOnly for security)
    response.cookies.set('google_access_token', tokens.access_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=auth_failed`
    );
  }
}

