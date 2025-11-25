import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getUserByUsername, getCredentialsByUserId, insertChallenge } from '@/lib/db';
import type { AuthenticationOptionsRequest } from '@/types/webauthn';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: AuthenticationOptionsRequest = await request.json();
    const { username } = body;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const credentials = await getCredentialsByUserId(user.id);
    if (credentials.length === 0) {
      return NextResponse.json(
        { error: 'No credentials found for user' },
        { status: 404 }
      );
    }
    
    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    
    const options = await generateAuthenticationOptions({
      rpID: rpId,
      allowCredentials: credentials.map(cred => ({
        id: cred.credential_id,
        type: 'public-key',
        transports: cred.transports as AuthenticatorTransport[] | undefined,
      })),
      userVerification: 'preferred',
      timeout: 60000,
    });
    
    // Store challenge with 60s TTL
    await insertChallenge(user.id, 'authentication', options.challenge, 60000);
    
    return NextResponse.json(options, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Authentication options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
