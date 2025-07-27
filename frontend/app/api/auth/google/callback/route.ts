import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    // Handle OAuth error
    return NextResponse.redirect(new URL(`/login?error=google_auth_failed&message=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  try {
    // Call backend to exchange code for token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.redirect(new URL(`/login?error=google_auth_failed&message=${errorData.detail}`, request.url));
    }

    const data = await response.json();
    
    // Redirect to frontend with token
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('google_token', data.access_token);
    redirectUrl.searchParams.set('needs_quiz', data.needs_quiz.toString());
    redirectUrl.searchParams.set('is_new_user', data.is_new_user.toString());
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=google_auth_failed&message=Authentication failed', request.url));
  }
} 