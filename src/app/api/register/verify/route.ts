import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { getUserByUsername, consumeChallenge, insertCredential } from '@/lib/db';

interface VerifyRequest {
  username: string;
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: AuthenticatorTransport[];
  };
  type: string;
  clientExtensionResults?: Record<string, unknown>;
  authenticatorAttachment?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();
    const { username, ...credential } = body;
    
    if (!username || !credential.id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user
    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Decode clientDataJSON to extract challenge
    const clientDataBytes = isoBase64URL.toBuffer(credential.response.clientDataJSON);
    const clientDataJSON = JSON.parse(new TextDecoder().decode(clientDataBytes));
    
    // Validate and consume challenge
    const challengeValid = await consumeChallenge(user.id, 'registration', clientDataJSON.challenge);
    if (!challengeValid) {
      return NextResponse.json(
        { error: 'Invalid or expired challenge' },
        { status: 400 }
      );
    }
    
    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const expectedOrigin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';
    
    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential as RegistrationResponseJSON,
      expectedChallenge: clientDataJSON.challenge,
      expectedOrigin,
      expectedRPID: rpId,
      requireUserVerification: false,
    });
    
    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Registration verification failed' },
        { status: 400 }
      );
    }
    
    const { credential: dbCredential, aaguid } = verification.registrationInfo;
    
    // Convert public key to PEM format for storage
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(dbCredential.publicKey).toString('base64').match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----\n`;
    
    await insertCredential(
      user.id,
      dbCredential.id,
      publicKeyPem,
      dbCredential.counter,
      credential.response.transports,
      aaguid
    );
    
    return NextResponse.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Registration verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
