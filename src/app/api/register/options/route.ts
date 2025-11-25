import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { findOrCreateUser, insertChallenge } from '@/lib/db';
import type { RegistrationOptionsRequest } from '@/types/webauthn';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: RegistrationOptionsRequest = await request.json();
    const { username, displayName } = body;
    
    if (!username || !displayName) {
      return NextResponse.json(
        { error: 'Username and displayName are required' },
        { status: 400 }
      );
    }
    
    const user = await findOrCreateUser(username, displayName);
    
    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const rpName = 'Passkey Demo';
    
    const options = await generateRegistrationOptions({
      rpName,
      rpID: rpId,
      userName: username,
      userDisplayName: displayName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      timeout: 60000,
    });
    
    // Store challenge with 60s TTL
    await insertChallenge(user.id, 'registration', options.challenge, 60000);
    
    return NextResponse.json(options, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Registration options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
