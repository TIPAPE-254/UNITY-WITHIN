import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'UNITY_WITHIN',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
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
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                emergency_phone VARCHAR(20) NULL,
                emergency_contact VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active TINYINT(1) DEFAULT 1
            )
        `;

        await pool.query(createTableQuery);

        // Check if emergency_contact column exists
        const [columns] = await pool.query(`SHOW COLUMNS FROM users LIKE 'emergency_contact'`);
        if (columns.length === 0) {
            await pool.query(`ALTER TABLE users ADD COLUMN emergency_contact VARCHAR(50)`);
            console.log('✅ Added emergency_contact column to users table');
        }

        // Ensure emergency_phone is nullable (migration)
        const [phoneColumns] = await pool.query(`SHOW COLUMNS FROM users LIKE 'emergency_phone'`);
        if (phoneColumns.length > 0 && phoneColumns[0].Null === 'NO') {
            await pool.query(`ALTER TABLE users MODIFY emergency_phone VARCHAR(20) NULL`);
            console.log('✅ Made emergency_phone column nullable');
        }

        // Check for role column
        const [roleColumns] = await pool.query(`SHOW COLUMNS FROM users LIKE 'role'`);
        if (roleColumns.length === 0) {
            await pool.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'`);
            console.log('✅ Added role column to users table');
        }

        // Create mood_logs table
        // Create user_moods table (Replces mood_logs)
        const createUserMoodsQuery = `
            CREATE TABLE IF NOT EXISTS user_moods (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL,
                mood ENUM('Happy', 'Calm', 'Okay', 'Sad', 'Stressed', 'Angry', 'Anxious', 'Tired') NOT NULL,
                intensity TINYINT CHECK (intensity BETWEEN 1 AND 10),
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
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type ENUM('public', 'private', 'support') DEFAULT 'public',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await pool.query(createChatRoomsQuery);
        console.log('✅ Chat rooms table initialized');

        // Create chat_messages table
        const createChatTableQuery = `
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                room_id INT UNSIGNED,
                user_id INT UNSIGNED,
                content TEXT NOT NULL,
                is_anonymous BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createChatTableQuery);
        console.log('✅ Chat messages table initialized');

        // Create reports table
        const createReportsTableQuery = `
            CREATE TABLE IF NOT EXISTS reports (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL,
                message_id INT UNSIGNED,
                reason TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createReportsTableQuery);
        console.log('✅ Reports table initialized');

        // Check for room_id column in chat_messages if table already existed
        const [chatMsgColumns] = await pool.query(`SHOW COLUMNS FROM chat_messages LIKE 'room_id'`);
        if (chatMsgColumns.length === 0) {
            await pool.query(`ALTER TABLE chat_messages ADD COLUMN room_id INT UNSIGNED DEFAULT NULL, ADD FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE`);
            console.log('✅ Added room_id column to chat_messages');
        }

        // Create journal_entries table
        const createJournalTableQuery = `
            CREATE TABLE IF NOT EXISTS journal_entries (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL,
                content TEXT NOT NULL,
                mood VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createJournalTableQuery);
        console.log('✅ Journal entries table initialized');

        // Check for mood_id column in journal_entries
        const [journalColumns] = await pool.query(`SHOW COLUMNS FROM journal_entries LIKE 'mood_id'`);
        if (journalColumns.length === 0) {
            await pool.query(`ALTER TABLE journal_entries ADD COLUMN mood_id INT UNSIGNED NULL, ADD FOREIGN KEY (mood_id) REFERENCES user_moods(id) ON DELETE SET NULL`);
            console.log('✅ Added mood_id column to journal_entries');
        }

        // Create moderation_logs table (for AI flagged messages)
        const createModerationLogsQuery = `
            CREATE TABLE IF NOT EXISTS moderation_logs (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED,
                content TEXT NOT NULL,
                reason VARCHAR(50) NOT NULL,
                flag_type ENUM('UNSAFE', 'CRISIS') NOT NULL,
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
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createTinyWinsQuery);
        console.log('✅ Tiny wins table initialized');

        // Check for reply_to_id column in chat_messages
        const [chatColumns] = await pool.query(`SHOW COLUMNS FROM chat_messages LIKE 'reply_to_id'`);
        if (chatColumns.length === 0) {
            await pool.query(`ALTER TABLE chat_messages ADD COLUMN reply_to_id INT UNSIGNED NULL, ADD FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL`);
            console.log('✅ Added reply_to_id column to chat_messages');
        }

        console.log('✅ Users table initialized');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
        // Don't rethrow, just log.
    }
}

export { pool, testConnection, initializeDatabase };
