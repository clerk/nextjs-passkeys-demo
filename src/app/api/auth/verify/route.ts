import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { getUserByUsername, consumeChallenge, getCredentialById, updateCredentialSignCount } from '@/lib/db';

interface VerifyRequest {
  username: string;
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
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
    const challengeValid = await consumeChallenge(user.id, 'authentication', clientDataJSON.challenge);
    if (!challengeValid) {
      return NextResponse.json(
        { error: 'Invalid or expired challenge' },
        { status: 400 }
      );
    }
    
    // Load credential
    const dbCredential = await getCredentialById(credential.id);
    if (!dbCredential || dbCredential.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }
    
    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const expectedOrigin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';
    
    // Extract public key from PEM format
    const publicKeyPem = dbCredential.public_key;
    const publicKeyBase64 = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
    const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64');
    
    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential as AuthenticationResponseJSON,
      expectedChallenge: clientDataJSON.challenge,
      expectedOrigin,
      expectedRPID: rpId,
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(publicKeyBytes),
        counter: dbCredential.sign_count,
      },
      requireUserVerification: false,
    });
    
    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Authentication verification failed' },
        { status: 401 }
      );
    }
    
    // Update sign count
    const newCounter = verification.authenticationInfo.newCounter;
    await updateCredentialSignCount(credential.id, newCounter);
    
    return NextResponse.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Authentication verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
