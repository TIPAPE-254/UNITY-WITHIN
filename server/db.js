import pg from 'pg';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * UNITY WITHIN Database Configuration
 * 
 * ✅ PostgreSQL Only Configuration:
 * 
 * LOCAL DEVELOPMENT (npm run dev:all):
 * - Uses PostgreSQL on localhost:5432
 * - Reads from server/.env and .env files
 * 
 * AZURE PRODUCTION (Web App):
 * - Uses PostgreSQL automatically detected via WEBSITE_INSTANCE_ID
 * - Reads credentials from App Service Configuration (APPSETTING_* prefix)
 * 
 * 📋 REQUIRED AZURE APP SETTINGS:
 * ─────────────────────────────────────────────────────────
 * Name                  | Value
 * ─────────────────────────────────────────────────────────
 * DB_HOST               | your-server.postgres.database.azure.com
 * DB_USER               | postgres@your-server
 * DB_PASSWORD           | <your-secure-password>
 * DB_NAME               | UNITY_WITHIN
 * DB_PORT               | 5432
 * DB_SSL                | true
 * ─────────────────────────────────────────────────────────
 * 
 * 🔗 GET THESE VALUES FROM:
 * Azure Portal → PostgreSQL resource → Connection strings
 * 
 * ⚠️ CRITICAL: If app fails to connect on production deploy:
 * 1. Check APP SERVICE LOGS (Monitoring → Logs)
 * 2. Verify DB_HOST, DB_USER, DB_PASSWORD are set
 * 3. Confirm PostgreSQL firewall allows App Service IP
 * 4. Ensure DB_SSL=true for Azure PostgreSQL
 */

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(serverDir, '..');

const loadDatabaseEnv = () => {
    const candidates = [
        path.resolve(workspaceRoot, '.env.local'),
        path.resolve(workspaceRoot, '.env'),
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(serverDir, '.env.local'),
        path.resolve(serverDir, '.env'),
    ];

    for (const envPath of candidates) {
        dotenv.config({ path: envPath, override: false });
    }
};

const readRuntimeEnv = (key, fallback = '') => {
    const direct = process.env[key];
    if (typeof direct === 'string' && direct.trim()) return direct.trim();

    const appSetting = process.env[`APPSETTING_${key}`];
    if (typeof appSetting === 'string' && appSetting.trim()) return appSetting.trim();

    return fallback;
};

loadDatabaseEnv();

// PostgreSQL only - Azure production
const { Pool } = pg;

const pgPool = new Pool({
    host: readRuntimeEnv('DB_HOST', 'localhost'),
    user: readRuntimeEnv('DB_USER', 'postgres'),
    password: readRuntimeEnv('DB_PASSWORD', ''),
    database: readRuntimeEnv('DB_NAME', 'UNITY_WITHIN'),
    port: parseInt(readRuntimeEnv('DB_PORT', '5432'), 10),
    ssl: readRuntimeEnv('DB_SSL', 'true') === 'true' ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

console.log(`🐘 PostgreSQL Config: host=${readRuntimeEnv('DB_HOST', 'localhost')} user=${readRuntimeEnv('DB_USER', 'postgres')} db=${readRuntimeEnv('DB_NAME', 'UNITY_WITHIN')} port=5432`);

const convertPlaceholders = (sql) => {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
};

const normalizeSql = (sql) => {
    let normalized = sql.replace(
        /NOW\(\)\s*-\s*INTERVAL\s+(\d+)\s+(DAY|WEEK|MONTH|YEAR)\b/gi,
        "NOW() - INTERVAL '$1 $2'"
    );
    normalized = normalized.replace(/\bDATETIME\b/gi, 'TIMESTAMP');
    return normalized;
};

const toSqlDateTime = (value) => {
    return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
};

const pool = {
    async query(sql, params = []) {
        try {
            if (!pgPool) {
                throw new Error('PostgreSQL pool not initialized. Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME env vars');
            }
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
        } catch (error) {
            console.error(`❌ Database query failed:`, {
                error: error.message,
                sql: sql.substring(0, 100),
                params: params.length > 0 ? `${params.length} params` : 'no params',
                dbHost: readRuntimeEnv('DB_HOST', 'not set'),
            });
            throw error;
        }
    }
};

async function isDatabaseAvailable() {
    try {
        await pool.query('SELECT 1');
        return true;
    } catch {
        return false;
    }
}

// Test the connection
async function testConnection() {
    try {
        const connection = await pgPool.connect();
        console.log('✅ PostgreSQL Database connected successfully!');
        connection.release();
    } catch (error) {
        console.error(`❌ Database connection failed:`, error.message);
        console.error(`\n⚠️ POSTGRESQL CONNECTION FAILED. Check these settings:`);
        console.error(`   1. Verify these environment variables are set:`);
        console.error(`      - DB_HOST: ${readRuntimeEnv('DB_HOST', '⚠️ NOT SET')}`);
        console.error(`      - DB_USER: ${readRuntimeEnv('DB_USER', '⚠️ NOT SET')}`);
        console.error(`      - DB_PASSWORD: ${readRuntimeEnv('DB_PASSWORD', '') ? '✅ Set' : '⚠️ NOT SET'}`);
        console.error(`      - DB_NAME: ${readRuntimeEnv('DB_NAME', '⚠️ NOT SET')}`);
        console.error(`   2. Ensure PostgreSQL firewall allows your IP`);
        console.error(`   3. Check PostgreSQL is running and credentials are correct`);
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
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local'`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(80)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trusted BOOLEAN DEFAULT FALSE`);
        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_user_id_unique ON users (clerk_user_id) WHERE clerk_user_id IS NOT NULL`);

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

        const createEventsQuery = `
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(180) UNIQUE NOT NULL,
                title TEXT NOT NULL,
                tagline TEXT,
                description TEXT,
                category VARCHAR(80) DEFAULT 'wellness',
                tags TEXT,
                template_type VARCHAR(40),
                date TIMESTAMP NOT NULL,
                end_date TIMESTAMP,
                duration INTEGER DEFAULT 60,
                location TEXT,
                is_online BOOLEAN DEFAULT FALSE,
                meeting_link TEXT,
                is_paid BOOLEAN DEFAULT FALSE,
                price INTEGER,
                currency VARCHAR(10) DEFAULT 'KES',
                payment_method VARCHAR(40) DEFAULT 'mpesa',
                early_bird_price INTEGER,
                discount_code VARCHAR(80),
                discount_percent INTEGER,
                capacity INTEGER,
                is_private BOOLEAN DEFAULT FALSE,
                is_recurring BOOLEAN DEFAULT FALSE,
                allow_anonymous BOOLEAN DEFAULT FALSE,
                allow_maybe BOOLEAN DEFAULT FALSE,
                waitlist_enabled BOOLEAN DEFAULT FALSE,
                chat_enabled BOOLEAN DEFAULT TRUE,
                recording_allowed BOOLEAN DEFAULT FALSE,
                send_invite_emails BOOLEAN DEFAULT TRUE,
                reminder_one_hour BOOLEAN DEFAULT TRUE,
                reminder_ten_minutes BOOLEAN DEFAULT TRUE,
                recommendations_enabled BOOLEAN DEFAULT TRUE,
                featured BOOLEAN DEFAULT FALSE,
                thumbnail_url TEXT,
                thumbnail_url_large TEXT,
                thumbnail_metadata JSON,
                image_gallery JSON,
                description_extended TEXT,
                description_html TEXT,
                video_url TEXT,
                video_metadata JSON,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `;
        await pool.query(createEventsQuery);
        // Ensure new columns exist for existing tables (including large content support)
        const eventColumns = [
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS tagline TEXT',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS template_type VARCHAR(40)',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_link TEXT',
            `ALTER TABLE events ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'KES'`,
            `ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40) DEFAULT 'mpesa'`,
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS early_bird_price INTEGER',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS discount_code VARCHAR(80)',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS discount_percent INTEGER',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_anonymous BOOLEAN DEFAULT FALSE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_maybe BOOLEAN DEFAULT FALSE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN DEFAULT FALSE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT TRUE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS recording_allowed BOOLEAN DEFAULT FALSE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS send_invite_emails BOOLEAN DEFAULT TRUE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_one_hour BOOLEAN DEFAULT TRUE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_ten_minutes BOOLEAN DEFAULT TRUE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS recommendations_enabled BOOLEAN DEFAULT TRUE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_url_large TEXT',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS description_extended TEXT',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS description_html TEXT',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS video_metadata JSON',
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS image_gallery JSON'
        ];
        for (const colQuery of eventColumns) {
            try { await pool.query(colQuery); } catch (e) { /* ignore if already exists or incompatible */ }
        }
        await pool.query(`CREATE INDEX IF NOT EXISTS events_date_idx ON events(date)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS events_private_idx ON events(is_private)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS events_category_idx ON events(category)`);

        const [eventCountRows] = await pool.query('SELECT COUNT(*)::int AS total FROM events');
        const eventCount = eventCountRows?.[0]?.total || 0;
        if (!eventCount) {
            await pool.query(
                `INSERT INTO events (slug, title, description, category, date, end_date, location, is_online, is_paid, price, capacity, is_private, thumbnail_url, video_url)
                 VALUES
                 (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
                 (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
                 (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'morning-grounding-circle',
                    'Morning Grounding Circle',
                    'A gentle 30-minute guided check-in to begin your day with steadiness and breath.',
                    'wellness',
                    toSqlDateTime(Date.now() + 24 * 60 * 60 * 1000),
                    toSqlDateTime(Date.now() + 25 * 60 * 60 * 1000),
                    'Online',
                    true,
                    false,
                    null,
                    30,
                    false,
                    null,
                    null,
                    'tiny-wins-story-night',
                    'Tiny Wins Story Night',
                    'Share one small win from this week and hear encouragement from the community.',
                    'community',
                    toSqlDateTime(Date.now() + 48 * 60 * 60 * 1000),
                    toSqlDateTime(Date.now() + 50 * 60 * 60 * 1000),
                    'Nairobi + Live Stream',
                    false,
                    false,
                    null,
                    50,
                    false,
                    null,
                    null,
                    'invite-only-healing-room',
                    'Invite-Only Healing Room',
                    'A moderated support room focused on emotional safety and peer reflection.',
                    'support',
                    toSqlDateTime(Date.now() + 72 * 60 * 60 * 1000),
                    toSqlDateTime(Date.now() + 73 * 60 * 60 * 1000),
                    'Private virtual room',
                    true,
                    true,
                    250,
                    20,
                    true,
                    null,
                    null
                ]
            );
        }
        console.log('✅ Events table initialized');

        const createRsvpsQuery = `
            CREATE TABLE IF NOT EXISTS rsvps (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                event_id INTEGER NOT NULL,
                status VARCHAR(10) NOT NULL,
                paid BOOLEAN DEFAULT FALSE,
                redirect_source VARCHAR(80),
                redirect_context TEXT,
                clerk_user_id VARCHAR(255),
                user_email_snapshot VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                UNIQUE (user_id, event_id)
            )
        `;
        await pool.query(createRsvpsQuery);
        await pool.query(`ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS redirect_source VARCHAR(80)`);
        await pool.query(`ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS redirect_context TEXT`);
        await pool.query(`ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255)`);
        await pool.query(`ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS user_email_snapshot VARCHAR(255)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS rsvps_event_idx ON rsvps(event_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS rsvps_user_idx ON rsvps(user_id)`);
        console.log('✅ RSVPs table initialized');

        const createInvitesQuery = `
            CREATE TABLE IF NOT EXISTS invites (
                id SERIAL PRIMARY KEY,
                event_id INTEGER NOT NULL,
                email VARCHAR(255),
                token VARCHAR(120) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createInvitesQuery);
        await pool.query(`CREATE INDEX IF NOT EXISTS invites_event_idx ON invites(event_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS invites_expires_idx ON invites(expires_at)`);
        console.log('✅ Event invites table initialized');

        const createEventMessagesQuery = `
            CREATE TABLE IF NOT EXISTS event_messages (
                id SERIAL PRIMARY KEY,
                event_id INTEGER NOT NULL,
                user_id INTEGER,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `;
        await pool.query(createEventMessagesQuery);
        await pool.query(`CREATE INDEX IF NOT EXISTS event_messages_event_idx ON event_messages(event_id)`);
        console.log('✅ Event messages table initialized');

        const createTherapistsQuery = `
            CREATE TABLE IF NOT EXISTS therapists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                name VARCHAR(120) NOT NULL,
                photo TEXT,
                email VARCHAR(255),
                phone VARCHAR(40),
                specialization VARCHAR(120) NOT NULL,
                bio TEXT,
                qualifications TEXT,
                experience VARCHAR(80) NOT NULL DEFAULT '1+ years',
                languages TEXT NOT NULL DEFAULT 'English, Swahili',
                availability VARCHAR(30) NOT NULL DEFAULT 'online',
                availability_schedule TEXT,
                session_price VARCHAR(80),
                rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
                status VARCHAR(20) NOT NULL DEFAULT 'inactive',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await pool.query(createTherapistsQuery);
        await pool.query(`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS user_id INTEGER`);
        await pool.query(`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS qualifications TEXT`);
        await pool.query(`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS availability_schedule TEXT`);
        await pool.query(`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS session_price VARCHAR(80)`);
        await pool.query(`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS password_hash TEXT`);
        await pool.query(`CREATE INDEX IF NOT EXISTS therapists_user_id_idx ON therapists(user_id)`);
        await pool.query(`UPDATE therapists SET status = 'approved' WHERE status = 'active'`);
        await pool.query(`UPDATE therapists SET status = 'pending' WHERE status IS NULL OR status = '' OR status = 'inactive'`);

        const [therapistCountRows] = await pool.query('SELECT COUNT(*)::int AS total FROM therapists');
        const therapistCount = therapistCountRows?.[0]?.total || 0;
        if (!therapistCount) {
            await pool.query(
                `INSERT INTO therapists (name, photo, email, phone, specialization, bio, qualifications, experience, languages, availability, availability_schedule, session_price, rating, status)
                 VALUES
                 (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
                 (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
                 (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'Dr. Amina Otieno', '', 'amina@unitywithin.app', '+254700000001', 'Anxiety, Depression', 'Trauma-informed counsellor focused on student and young-adult wellbeing.', 'MSc Clinical Psychology, KCPA Licensed', '7+ years', 'English, Swahili', 'online', 'Mon-Fri, 9:00 AM - 5:00 PM', '$5 chat / $10 video', 4.8, 'approved',
                    'Kevin Mwangi, MFT', '', 'kevin@unitywithin.app', '+254700000002', 'Trauma, Relationships', 'Helps clients with stress, trauma recovery, and relationship communication.', 'MFT, CBT Practitioner', '5+ years', 'English, Swahili, Kikuyu', 'hybrid', 'Mon-Sat, 10:00 AM - 7:00 PM', '$5 chat / $10 video', 4.7, 'approved',
                    'Rose Njeri', '', 'rose@unitywithin.app', '+254700000003', 'Burnout, Career Stress', 'Supports professionals and students navigating pressure and burnout.', 'BSc Psychology, Certified Counsellor', '6+ years', 'English, Swahili', 'online', 'Mon-Fri, 8:00 AM - 4:00 PM', '$5 chat / $10 video', 4.6, 'approved'
                ]
            );
        }
        console.log('✅ Therapists table initialized');

        const createTherapistInvitesQuery = `
            CREATE TABLE IF NOT EXISTS therapist_invites (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(40),
                token VARCHAR(120) UNIQUE NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                expires_at TIMESTAMP NOT NULL,
                accepted_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await pool.query(createTherapistInvitesQuery);
        await pool.query(`CREATE INDEX IF NOT EXISTS therapist_invites_email_idx ON therapist_invites(email)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS therapist_invites_status_idx ON therapist_invites(status)`);
        console.log('✅ Therapist invites table initialized');

        const createSupportSessionsQuery = `
            CREATE TABLE IF NOT EXISTS support_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                therapist_id INTEGER NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('chat', 'call')),
                call_mode VARCHAR(20) CHECK (call_mode IN ('voice', 'video')),
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                status VARCHAR(20) NOT NULL DEFAULT 'started',
                priority VARCHAR(20) NOT NULL DEFAULT 'normal',
                rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createSupportSessionsQuery);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS call_mode VARCHAR(20)`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating BETWEEN 1 AND 5)`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal'`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS scheduled_date DATE`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS scheduled_time VARCHAR(10)`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS preferred_timeframe VARCHAR(120)`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS client_name VARCHAR(120)`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS client_phone VARCHAR(40)`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS client_age VARCHAR(10)`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS client_email VARCHAR(255)`);
        await pool.query(`ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS issue_description TEXT`);
        await pool.query(`UPDATE support_sessions SET priority = 'normal' WHERE priority IS NULL`);
        console.log('✅ Support sessions table initialized');

        const createSupportSessionMessagesQuery = `
            CREATE TABLE IF NOT EXISTS support_session_messages (
                id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL,
                sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user', 'therapist')),
                sender_name VARCHAR(120),
                content TEXT NOT NULL,
                attachment_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES support_sessions(id) ON DELETE CASCADE
            )
        `;
        await pool.query(createSupportSessionMessagesQuery);
        await pool.query(`ALTER TABLE support_session_messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255)`);
        console.log('✅ Support session messages table initialized');

        const createSupportNotificationsQuery = `
            CREATE TABLE IF NOT EXISTS support_notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                session_id INTEGER,
                type VARCHAR(40) NOT NULL,
                title VARCHAR(160),
                message TEXT NOT NULL,
                event_key VARCHAR(160),
                payload TEXT,
                channel VARCHAR(20) NOT NULL DEFAULT 'in_app',
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (session_id) REFERENCES support_sessions(id) ON DELETE SET NULL
            )
        `;
        await pool.query(createSupportNotificationsQuery);
        await pool.query(`ALTER TABLE support_notifications ADD COLUMN IF NOT EXISTS event_key VARCHAR(160)`);
        await pool.query(`ALTER TABLE support_notifications ADD COLUMN IF NOT EXISTS payload TEXT`);
        await pool.query(`ALTER TABLE support_notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'in_app'`);
        await pool.query(`ALTER TABLE support_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE support_notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP`);
        await pool.query(`CREATE INDEX IF NOT EXISTS support_notifications_user_idx ON support_notifications(user_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS support_notifications_user_read_idx ON support_notifications(user_id, is_read)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS support_notifications_created_idx ON support_notifications(created_at)`);
        console.log('✅ Support notifications table initialized');

        console.log('✅ Users table initialized');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
        console.error('ℹ️ Check DB_TYPE/DB_HOST/DB_PORT/DB_USER/DB_PASSWORD in .env.local or server/.env and ensure your DB service is running.');
        // Don't rethrow, just log.
    }
}

export { pool, testConnection, initializeDatabase, isDatabaseAvailable };
