export interface RegistrationOptionsRequest {
    username: string;
    displayName: string;
}

export interface RegistrationOptionsResponse {
    challenge: string;
    rp: {
        name: string;
        id: string;
    };
    user: {
        id: string;
        name: string;
        displayName: string;
    };
    pubKeyCredParams: Array<{
        type: 'public-key';
        alg: number;
    }>;
    timeout: number;
    attestation: 'none' | 'indirect' | 'direct';
    authenticatorSelection?: {
        residentKey?: 'discouraged' | 'preferred' | 'required';
        userVerification?: 'discouraged' | 'preferred' | 'required';
    };
}

export interface RegistrationVerifyRequest {
    id: string;
    rawId: string;
    response: {
        clientDataJSON: string;
        attestationObject: string;
        transports?: string[];
    };
    type: 'public-key';
    username: string;
}

export interface AuthenticationOptionsRequest {
    username: string;
}

export interface AuthenticationOptionsResponse {
    challenge: string;
    timeout: number;
    rpId: string;
    allowCredentials: Array<{
        id: string;
        type: 'public-key';
        transports?: string[];
    }>;
    userVerification?: 'discouraged' | 'preferred' | 'required';
}

export interface AuthenticationVerifyRequest {
    id: string;
    rawId: string;
    response: {
        clientDataJSON: string;
        authenticatorData: string;
        signature: string;
        userHandle?: string;
    };
    type: 'public-key';
    username: string;
}
