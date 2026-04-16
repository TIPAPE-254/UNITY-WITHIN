import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

dotenv.config();

async function inspect() {
    const pool = new Pool({
        host: process.env.DB_HOST || process.env.POSTGRES_HOST || '127.0.0.1',
        user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
        password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '',
        database: process.env.DB_NAME || process.env.POSTGRES_DB || 'UNITY_WITHIN',
        port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
        ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true'
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