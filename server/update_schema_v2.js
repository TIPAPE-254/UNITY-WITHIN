import { pool } from './db.js';

async function updateSchema() {
    try {
        console.log("Updating schema to PostgreSQL...");

        await pool.query('DROP TABLE IF EXISTS journal_entries');
        await pool.query('DROP TABLE IF EXISTS tiny_wins');
        await pool.query('DROP TABLE IF EXISTS moderation_logs');
        await pool.query('DROP TABLE IF EXISTS reports');
        await pool.query('DROP TABLE IF EXISTS chat_messages');
        await pool.query('DROP TABLE IF EXISTS chat_rooms');
        await pool.query('DROP TABLE IF EXISTS user_moods');
        await pool.query('DROP TABLE IF EXISTS users');

        console.log("Dropped old tables.");

        await pool.query(`
            CREATE TABLE users (
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
        console.log("Created users table.");

        await pool.query(`
            CREATE TABLE user_moods (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                mood VARCHAR(50) NOT NULL,
                intensity SMALLINT CHECK (intensity BETWEEN 1 AND 10),
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Created user_moods table.");

        await pool.query(`
            CREATE TABLE chat_rooms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(20) DEFAULT 'public',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created chat_rooms table.");

        await pool.query(`
            CREATE TABLE chat_messages (
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
        console.log("Created chat_messages table.");

        await pool.query(`
            CREATE TABLE reports (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                message_id INTEGER,
                reason TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
            )
        `);
        console.log("Created reports table.");

        await pool.query(`
            CREATE TABLE journal_entries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                mood VARCHAR(50),
                mood_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (mood_id) REFERENCES user_moods(id) ON DELETE SET NULL
            )
        `);
        console.log("Created journal_entries table.");

        await pool.query(`
            CREATE TABLE moderation_logs (
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
        console.log("Created moderation_logs table.");

        await pool.query(`
            CREATE TABLE tiny_wins (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Created tiny_wins table.");

        console.log("PostgreSQL schema update complete!");
        process.exit(0);
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
}

updateSchema();