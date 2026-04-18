import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

dotenv.config();

const readEnv = (...keys) => {
    for (const key of keys) {
        const value = process.env[key];
        if (value && String(value).trim()) return String(value).trim();
    }
    return '';
};

async function inspect() {
    const connectionString = readEnv('DATABASE_URL', 'POSTGRES_URL', 'DB_CONNECTION_STRING');
    const host = readEnv('DB_HOST', 'POSTGRES_HOST');
    const user = readEnv('DB_USER', 'POSTGRES_USER');
    const database = readEnv('DB_NAME', 'POSTGRES_DB');

    if (!connectionString && (!host || !user || !database)) {
        console.error('Missing PostgreSQL settings. Set Azure DB env vars or DATABASE_URL before running inspect_db.js.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: connectionString || undefined,
        host: connectionString ? undefined : host,
        user: connectionString ? undefined : user,
        password: connectionString ? undefined : readEnv('DB_PASSWORD', 'POSTGRES_PASSWORD'),
        database: connectionString ? undefined : database,
        port: Number(readEnv('DB_PORT', 'POSTGRES_PORT') || 5432),
        ssl: ['true', '1', 'require', 'verify-ca', 'verify-full'].includes((readEnv('DB_SSL', 'PGSSLMODE') || 'true').toLowerCase())
            ? { rejectUnauthorized: false }
            : false,
    });

    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        console.log('Current User Table Columns:');
        console.table(result.rows);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

inspect();