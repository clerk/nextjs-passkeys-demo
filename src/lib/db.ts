import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
    if (!pool) {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        pool = new Pool({
            connectionString: databaseUrl,
            ssl: false,
        });
    }
    return pool;
}

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }> {
    const pool = getPool();
    const result = await pool.query(text, params);
    return { rows: result.rows as T[] };
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

interface User {
    id: number;
    username: string;
    display_name: string;
}

export async function findOrCreateUser(username: string, displayName: string): Promise<User> {
    const normalized = username.trim().toLowerCase();
    
    const existing = await query<User>(
        'SELECT id, username, display_name FROM users WHERE username = $1',
        [normalized]
    );
    
    if (existing.rows.length > 0) {
        return existing.rows[0];
    }
    
    const created = await query<User>(
        'INSERT INTO users (username, display_name) VALUES ($1, $2) RETURNING id, username, display_name',
        [normalized, displayName]
    );
    
    return created.rows[0];
}

export async function getUserByUsername(username: string): Promise<User | null> {
    const normalized = username.trim().toLowerCase();
    const result = await query<User>(
        'SELECT id, username, display_name FROM users WHERE username = $1',
        [normalized]
    );
    return result.rows[0] || null;
}

export async function insertChallenge(
    userId: number,
    type: 'registration' | 'authentication',
    challenge: string,
    ttlMs: number
): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs);
    await query(
        'INSERT INTO challenges (user_id, type, challenge, expires_at) VALUES ($1, $2, $3, $4)',
        [userId, type, challenge, expiresAt]
    );
}

export async function consumeChallenge(
    userId: number,
    type: 'registration' | 'authentication',
    challenge: string
): Promise<boolean> {
    const result = await query<{ id: number; expires_at: Date }>(
        'DELETE FROM challenges WHERE user_id = $1 AND type = $2 AND challenge = $3 AND expires_at > NOW() RETURNING id, expires_at',
        [userId, type, challenge]
    );
    return result.rows.length > 0;
}

interface Credential {
    id: number;
    user_id: number;
    credential_id: string;
    public_key: string;
    sign_count: number;
    transports: string[] | null;
    aaguid: string | null;
}

export async function getCredentialsByUserId(userId: number): Promise<Credential[]> {
    const result = await query<Credential>(
        'SELECT id, user_id, credential_id, public_key, sign_count, transports, aaguid FROM credentials WHERE user_id = $1',
        [userId]
    );
    return result.rows;
}

export async function getCredentialById(credentialId: string): Promise<Credential | null> {
    const result = await query<Credential>(
        'SELECT id, user_id, credential_id, public_key, sign_count, transports, aaguid FROM credentials WHERE credential_id = $1',
        [credentialId]
    );
    return result.rows[0] || null;
}

export async function insertCredential(
    userId: number,
    credentialId: string,
    publicKey: string,
    signCount: number,
    transports?: string[],
    aaguid?: string
): Promise<void> {
    await query(
        'INSERT INTO credentials (user_id, credential_id, public_key, sign_count, transports, aaguid) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, credentialId, publicKey, signCount, transports || null, aaguid || null]
    );
}

export async function updateCredentialSignCount(credentialId: string, newCount: number): Promise<void> {
    await query(
        'UPDATE credentials SET sign_count = $1 WHERE credential_id = $2',
        [newCount, credentialId]
    );
}
