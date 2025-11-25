import PasskeyRegister from '@/components/PasskeyRegister';
import PasskeyAuth from '@/components/PasskeyAuth';

export default function Home() {
  return (
    <div className="min-h-screen write  py-12 px-4">
      <main className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Passkey Demo
          </h1>
          <p className="text-gray-600">
            Passwordless authentication implemented from scratch
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <PasskeyRegister />
          <PasskeyAuth />
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">How it works</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>Registration:</strong> Creates a new passkey using your device's biometric
              sensor or security key. The private key never leaves your device.
            </p>
            <p>
              <strong>Authentication:</strong> Uses the stored passkey to sign a challenge,
              proving your identity without passwords.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              This implementation uses WebAuthn with ES256 (ECDSA P-256), attestation format "none",
              and PostgreSQL for credential storage.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
