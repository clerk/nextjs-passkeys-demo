import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { config } from 'dotenv'

config()

async function migrate() {
    const reseed = process.argv.includes('--reseed');
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('ERROR: DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: databaseUrl,
        ssl: false,
    });

    try {
        console.log('Connecting to database...');
        await pool.query('SELECT NOW()');
        console.log('Connected successfully');

        const schemaPath = join(process.cwd(), 'db', 'schema.sql');
        const schema = readFileSync(schemaPath, 'utf-8');

        console.log(reseed ? 'Reseeding database...' : 'Running migrations...');
        await pool.query(schema);
        console.log('✓ Schema applied successfully');

        if (reseed) {
            console.log('✓ Database reseeded');
        } else {
            console.log('✓ Migration completed');
        }
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
