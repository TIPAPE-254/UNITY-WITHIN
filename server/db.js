import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'UNITY_WITHIN',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

const convertPlaceholders = (sql) => {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
};

const normalizeSql = (sql) => {
    return sql.replace(/NOW\(\)\s*-\s*INTERVAL\s+(\d+)\s+DAY/gi, "NOW() - INTERVAL '$1 DAY'");
};

const pool = {
    async query(sql, params = []) {
        const normalized = normalizeSql(sql);
        const converted = convertPlaceholders(normalized);
        const isInsert = /^\s*INSERT\s+/i.test(converted) && !/\bRETURNING\b/i.test(converted);
        const finalSql = isInsert ? `${converted} RETURNING id` : converted;

        const result = await pgPool.query(finalSql, params);

        if (isInsert) {
            return [{
                insertId: result.rows[0]?.id || null,
                affectedRows: result.rowCount || 0
            }];
        }

        return [result.rows];
    }
};

// Test the connection
async function testConnection() {
    try {
        const connection = await pgPool.connect();
        console.log('✅ Database connected successfully!');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.warn('⚠️ Server will continue running without database features.');
    }
}

// Create users table if it doesn't exist
async function initializeDatabase() {
    try {
        const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                emergency_phone VARCHAR(20) NULL,
                emergency_contact VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                role VARCHAR(20) DEFAULT 'user'
            )
        `;

        await pool.query(createUsersTableQuery);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(50)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP`);

        const createUserMoodsQuery = `
            CREATE TABLE IF NOT EXISTS user_moods (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                mood VARCHAR(20) NOT NULL CHECK (mood IN ('Happy', 'Calm', 'Okay', 'Sad', 'Stressed', 'Angry', 'Anxious', 'Tired')),
                intensity SMALLINT CHECK (intensity BETWEEN 1 AND 10),
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createUserMoodsQuery);
        console.log('✅ User moods table initialized');

        // Create chat_rooms table
        const createChatRoomsQuery = `
            CREATE TABLE IF NOT EXISTS chat_rooms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(20) DEFAULT 'public' CHECK (type IN ('public', 'private', 'support')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await pool.query(createChatRoomsQuery);
        console.log('✅ Chat rooms table initialized');

        // Create chat_messages table
        const createChatTableQuery = `
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                room_id INTEGER,
                user_id INTEGER,
                content TEXT NOT NULL,
                is_anonymous BOOLEAN DEFAULT TRUE,
                reply_to_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
                FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL
            )
        `;
        await pool.query(createChatTableQuery);
        console.log('✅ Chat messages table initialized');

        // Create reports table
        const createReportsTableQuery = `
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                message_id INTEGER,
                reason TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createReportsTableQuery);
        console.log('✅ Reports table initialized');

        // Create journal_entries table
        const createJournalTableQuery = `
            CREATE TABLE IF NOT EXISTS journal_entries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                mood VARCHAR(50),
                mood_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (mood_id) REFERENCES user_moods(id) ON DELETE SET NULL
            )
        `;
        await pool.query(createJournalTableQuery);
        console.log('✅ Journal entries table initialized');

        // Create moderation_logs table (for AI flagged messages)
        const createModerationLogsQuery = `
            CREATE TABLE IF NOT EXISTS moderation_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                content TEXT NOT NULL,
                reason VARCHAR(50) NOT NULL,
                flag_type VARCHAR(20) NOT NULL CHECK (flag_type IN ('UNSAFE', 'CRISIS')),
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `;
        await pool.query(createModerationLogsQuery);
        console.log('✅ Moderation logs table initialized');

        // Create tiny_wins table
        const createTinyWinsQuery = `
            CREATE TABLE IF NOT EXISTS tiny_wins (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createTinyWinsQuery);
        console.log('✅ Tiny wins table initialized');

        console.log('✅ Users table initialized');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
        // Don't rethrow, just log.
    }
}

export { pool, testConnection, initializeDatabase };
