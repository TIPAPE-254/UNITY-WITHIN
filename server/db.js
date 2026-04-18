import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const dbHost = process.env.POSTGRES_HOST || process.env.DB_HOST || '127.0.0.1';
const dbUser = process.env.POSTGRES_USER || process.env.DB_USER || 'postgres';
const dbPassword = process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '';
const dbName = process.env.POSTGRES_DB || process.env.DB_NAME || 'UNITY_WITHIN';
const dbPort = Number(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432);

const dbSsl = (process.env.DB_SSL || 'true').toLowerCase() === 'true';

console.log(`📦 Database: ${isProduction ? 'Production (Azure PostgreSQL)' : 'Development'}`);
console.log(`   Host: ${dbHost}, DB: ${dbName}`);

if (isProduction && (!dbHost || !dbUser)) {
    console.warn('⚠️ PostgreSQL connection missing required Azure settings.');
}

const pool = new Pool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    port: dbPort,
    ssl: dbSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL database connected successfully!');
        client.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.warn('⚠️ Server will continue running without database features.');
    }
}

async function isDatabaseAvailable() {
    try {
        const client = await pool.connect();
        client.release();
        return true;
    } catch {
        return false;
    }
}

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                emergency_phone VARCHAR(20),
                emergency_contact VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);

        await client.query(`
            ALTER TABLE users ALTER COLUMN emergency_phone DROP NOT NULL
        `);

        const roleCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
        `);
        if (roleCheck.rows.length === 0) {
            await client.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'`);
            console.log('✅ Added role column to users table');
        }

        await client.query(`
            CREATE TABLE IF NOT EXISTS user_moods (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                mood VARCHAR(50) NOT NULL,
                intensity SMALLINT CHECK (intensity BETWEEN 1 AND 10),
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_rooms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(20) DEFAULT 'public',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                room_id INTEGER,
                user_id INTEGER,
                content TEXT NOT NULL,
                is_anonymous BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                message_id INTEGER,
                reason TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS journal_entries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                mood VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        const moodIdCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'journal_entries' AND column_name = 'mood_id'
        `);
        if (moodIdCheck.rows.length === 0) {
            await client.query(`ALTER TABLE journal_entries ADD COLUMN mood_id INTEGER REFERENCES user_moods(id) ON DELETE SET NULL`);
            console.log('✅ Added mood_id column to journal_entries');
        }

        await client.query(`
            CREATE TABLE IF NOT EXISTS moderation_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                content TEXT NOT NULL,
                reason VARCHAR(50) NOT NULL,
                flag_type VARCHAR(20) NOT NULL,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS tiny_wins (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        const replyToCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'chat_messages' AND column_name = 'reply_to_id'
        `);
        if (replyToCheck.rows.length === 0) {
            await client.query(`ALTER TABLE chat_messages ADD COLUMN reply_to_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL`);
            console.log('✅ Added reply_to_id column to chat_messages');
        }

        // Ensure therapist_invites table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS therapist_invites (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255),
                phone VARCHAR(50),
                token VARCHAR(255) UNIQUE NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                invited_by INTEGER REFERENCES users(id)
            )
        `);

        // Ensure therapists table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS therapists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                password_hash TEXT,
                specialization VARCHAR(255),
                bio TEXT,
                qualifications TEXT,
                experience VARCHAR(100),
                languages JSONB DEFAULT '[]',
                availability VARCHAR(50) DEFAULT 'online',
                availability_schedule TEXT DEFAULT '',
                session_price VARCHAR(255) DEFAULT '',
                rating DECIMAL(3,2) DEFAULT 4.5,
                status VARCHAR(50) DEFAULT 'pending',
                terms_accepted_at TIMESTAMP NULL,
                terms_version VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add terms columns if missing
        const termsCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'therapists' AND column_name = 'terms_accepted_at'
        `);
        if (termsCheck.rows.length === 0) {
            await client.query(`ALTER TABLE therapists ADD COLUMN terms_accepted_at TIMESTAMP NULL`);
            await client.query(`ALTER TABLE therapists ADD COLUMN terms_version VARCHAR(20)`);
            console.log('✅ Added terms acceptance columns to therapists');
        }

        console.log('✅ PostgreSQL tables initialized');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
    } finally {
        client.release();
    }
}

export { pool, testConnection, initializeDatabase, isDatabaseAvailable };

export async function query(sql, params = []) {
    try {
        const result = await pool.query(sql, params);
        return result.rows || [];
    } catch (error) {
        console.error('DB query error:', error.message);
        return [];
    }
}

export async function queryOne(sql, params = []) {
    try {
        const result = await pool.query(sql, params);
        return result.rows?.[0] || null;
    } catch (error) {
        console.error('DB queryOne error:', error.message);
        return null;
    }
}