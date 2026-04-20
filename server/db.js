import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const isProduction = process.env.NODE_ENV === 'production';
const isAzureAppService = Boolean(
    process.env.WEBSITE_INSTANCE_ID || process.env.WEBSITE_SITE_NAME,
);

const envCandidates = [
    path.resolve(workspaceRoot, '.env.local'),
    path.resolve(workspaceRoot, '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '.env'),
];

// In Azure/App Service, credentials are expected from process.env (App Settings).
// Local .env files are only a development fallback.
if (!isProduction && !isAzureAppService) {
    for (const envPath of envCandidates) {
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath, override: false });
        }
    }
}

const readSetting = (...keys) => {
    for (const key of keys) {
        const direct = process.env[key];
        if (direct && String(direct).trim()) return String(direct).trim();

        const appSetting = process.env[`APPSETTING_${key}`];
        if (appSetting && String(appSetting).trim()) return String(appSetting).trim();
    }
    return '';
};

const readAzurePostgresConnString = () => {
    const matchedKey = Object.keys(process.env).find((key) =>
        key.startsWith('POSTGRESQLCONNSTR_'),
    );
    if (!matchedKey) return '';

    const value = process.env[matchedKey];
    return value && String(value).trim() ? String(value).trim() : '';
};

const connectionString = readSetting('DATABASE_URL', 'POSTGRES_URL', 'DB_CONNECTION_STRING') || readAzurePostgresConnString();
const dbHost = readSetting('POSTGRES_HOST', 'DB_HOST', 'PGHOST');
const dbUser = readSetting('POSTGRES_USER', 'DB_USER', 'PGUSER');
const dbPassword = readSetting('POSTGRES_PASSWORD', 'DB_PASSWORD', 'PGPASSWORD');
const dbName = readSetting('POSTGRES_DB', 'DB_NAME', 'PGDATABASE');
const dbPort = Number(readSetting('POSTGRES_PORT', 'DB_PORT', 'PGPORT') || 5432);
const localDbHosts = new Set(['127.0.0.1', 'localhost', '::1']);
const isLocalHostConfigured = dbHost ? localDbHosts.has(dbHost.toLowerCase()) : false;

const sslSetting = readSetting('DB_SSL', 'PGSSLMODE');
const dbSsl = ['true', '1', 'require', 'verify-ca', 'verify-full'].includes(
    String(sslSetting || 'true').toLowerCase(),
);

console.log(`📦 Database: ${isProduction ? 'Production (Azure PostgreSQL)' : 'Development'}`);
console.log(`   Host: ${dbHost || '(from connection string)'}, DB: ${dbName || '(from connection string)'}`);

if (!connectionString && (!dbHost || !dbUser || !dbName)) {
    console.warn('⚠️ PostgreSQL connection settings are incomplete. Provide Azure DB env vars or DATABASE_URL.');
}

if (!connectionString && isLocalHostConfigured) {
    console.error('❌ Local database host is disabled. Configure Azure PostgreSQL App Settings in process.env.');
}

const pool = new Pool(
    connectionString
        ? {
            connectionString,
            ssl: dbSsl ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        }
        : {
            host: (isLocalHostConfigured && isProduction) ? 'azure-db-host-not-configured' : dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
            port: dbPort,
            ssl: dbSsl ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        },
);

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
    let client;
    try {
        client = await pool.connect();
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

        // Ensure volunteer_invites table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_invites (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                invited_by VARCHAR(255)
            )
        `);

        // Ensure volunteer roles table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_roles (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(80) NOT NULL,
                work_mode VARCHAR(40) DEFAULT 'Remote',
                description TEXT
            )
        `);

        // Ensure volunteer applications table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_applications (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(120) NOT NULL,
                last_name VARCHAR(120) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                location VARCHAR(160) NOT NULL,
                availability VARCHAR(40) NOT NULL,
                category VARCHAR(80) NOT NULL,
                roles JSONB NOT NULL DEFAULT '[]',
                skills TEXT,
                why_volunteer TEXT NOT NULL,
                mental_health_context VARCHAR(60),
                work_preference VARCHAR(60) NOT NULL,
                notes TEXT,
                status VARCHAR(40) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure volunteers table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                county VARCHAR(120),
                skills TEXT,
                matched_role_id INTEGER REFERENCES volunteer_roles(id) ON DELETE SET NULL,
                commitment_level VARCHAR(50),
                tier VARCHAR(50),
                category VARCHAR(80),
                availability VARCHAR(40),
                work_preference VARCHAR(60),
                mental_health_context VARCHAR(60),
                motivation TEXT,
                status VARCHAR(50) DEFAULT 'pending_review',
                hours_contributed NUMERIC(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const volunteerColumns = [
            { name: 'category', sql: "ALTER TABLE volunteers ADD COLUMN category VARCHAR(80)" },
            { name: 'availability', sql: "ALTER TABLE volunteers ADD COLUMN availability VARCHAR(40)" },
            { name: 'work_preference', sql: "ALTER TABLE volunteers ADD COLUMN work_preference VARCHAR(60)" },
            { name: 'mental_health_context', sql: "ALTER TABLE volunteers ADD COLUMN mental_health_context VARCHAR(60)" },
            { name: 'motivation', sql: "ALTER TABLE volunteers ADD COLUMN motivation TEXT" },
            { name: 'hours_contributed', sql: "ALTER TABLE volunteers ADD COLUMN hours_contributed NUMERIC(10,2) DEFAULT 0" },
        ];

        for (const column of volunteerColumns) {
            const check = await client.query(
                `SELECT column_name FROM information_schema.columns WHERE table_name = 'volunteers' AND column_name = $1`,
                [column.name],
            );
            if (check.rows.length === 0) {
                await client.query(column.sql);
                console.log(`✅ Added ${column.name} column to volunteers`);
            }
        }

        // Ensure volunteer tasks table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_tasks (
                id SERIAL PRIMARY KEY,
                volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(80),
                due_date TIMESTAMP,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure volunteer hours log table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_hours (
                id SERIAL PRIMARY KEY,
                volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE CASCADE,
                description TEXT,
                hours NUMERIC(6,2) NOT NULL,
                logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure volunteer training table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_training (
                id SERIAL PRIMARY KEY,
                volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                status VARCHAR(40) DEFAULT 'pending',
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure volunteer shifts table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_shifts (
                id SERIAL PRIMARY KEY,
                volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE CASCADE,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const volunteerRoleCount = await client.query(
            "SELECT COUNT(*) AS total FROM volunteer_roles"
        );
        const totalRoles = Number(volunteerRoleCount.rows?.[0]?.total || 0);
        if (totalRoles === 0) {
            await client.query(`
                INSERT INTO volunteer_roles (title, category, work_mode, description) VALUES
                ('Community moderator (comments, chats, forums)', 'Community', 'Remote', 'Moderate comments, chats, and community forums.'),
                ('Social media content creator (Instagram, TikTok, Facebook, LinkedIn)', 'Creative', 'Remote', 'Create social media content for Unity Within.'),
                ('Social media scheduler and page manager', 'Creative', 'Remote', 'Schedule and manage social media posts.'),
                ('Graphic designer (posts, flyers, banners)', 'Creative', 'Remote', 'Design graphics for campaigns and outreach.'),
                ('Video editor (short-form awareness videos)', 'Creative', 'Remote', 'Edit short-form awareness videos.'),
                ('Blog writer (mental health, self-acceptance, healing)', 'Creative', 'Remote', 'Write blog content on mental health topics.'),
                ('Copywriter (website pages, emails, campaigns)', 'Creative', 'Remote', 'Write copy for web and email campaigns.'),
                ('Newsletter writer and email campaign assistant', 'Creative', 'Remote', 'Support newsletter and email drafts.'),
                ('Website tester (broken links, bugs, UX issues)', 'Tech', 'Remote', 'Test website usability and bugs.'),
                ('App tester (mobile and web features pre-launch)', 'Tech', 'Remote', 'Test app features before launch.'),
                ('Community outreach (schools, churches, clubs, partners)', 'Outreach', 'Remote', 'Coordinate outreach initiatives.'),
                ('Partnership coordinator', 'Outreach', 'Remote', 'Manage partnerships and collaborations.'),
                ('Event planner (online workshops, awareness campaigns)', 'Support & Admin', 'Remote', 'Plan online workshops and campaigns.'),
                ('Event host or virtual session assistant', 'Support & Admin', 'Remote', 'Host or assist in virtual sessions.'),
                ('Peer support listener (non-crisis, welcoming)', 'Community', 'Remote', 'Provide welcoming peer support.'),
                ('Resource researcher (mental health tools, articles)', 'Support & Admin', 'Remote', 'Research mental health resources.'),
                ('Translation volunteer (local languages, accessibility)', 'Support & Admin', 'Remote', 'Translate content for accessibility.'),
                ('Data entry and admin support', 'Support & Admin', 'Remote', 'Support data entry and admin tasks.'),
                ('Fundraising assistant (donation drives, sponsorship)', 'Outreach', 'Remote', 'Support fundraising and sponsorships.'),
                ('Brand ambassador (peer circles, communities)', 'Outreach', 'Remote', 'Represent Unity Within in communities.')
            `);
            console.log('✅ Seeded volunteer roles');
        }

        // Ensure peer support listeners table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS peer_support_listeners (
                id SERIAL PRIMARY KEY,
                volunteer_id INTEGER UNIQUE REFERENCES volunteers(id) ON DELETE CASCADE,
                user_email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                is_available BOOLEAN DEFAULT TRUE,
                current_call_id VARCHAR(255),
                max_concurrent_calls INTEGER DEFAULT 1,
                calls_handled INTEGER DEFAULT 0,
                average_rating DECIMAL(3,2) DEFAULT 0,
                approved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure peer support calls table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS peer_support_calls (
                id VARCHAR(255) PRIMARY KEY,
                listener_volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE SET NULL,
                client_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                client_email VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                call_type VARCHAR(20),
                started_at TIMESTAMP,
                ended_at TIMESTAMP,
                duration_seconds INTEGER,
                notes TEXT,
                client_rating INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

        // ────────────────────────────────────────────────────────────────
        // RBAC (Role-Based Access Control) Tables
        // ────────────────────────────────────────────────────────────────

        // Volunteer RBAC Roles table
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_rbac_roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                display_name VARCHAR(150) NOT NULL,
                description TEXT,
                is_system BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Volunteer Permissions table (all available permissions)
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_permissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                display_name VARCHAR(150) NOT NULL,
                description TEXT,
                category VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Role to Permissions mapping (many-to-many)
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_role_permissions (
                role_id INTEGER NOT NULL REFERENCES volunteer_rbac_roles(id) ON DELETE CASCADE,
                permission_id INTEGER NOT NULL REFERENCES volunteer_permissions(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (role_id, permission_id)
            )
        `);

        // User-level permission overrides
        await client.query(`
            CREATE TABLE IF NOT EXISTS volunteer_user_permissions (
                id SERIAL PRIMARY KEY,
                volunteer_id INTEGER NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
                permission_id INTEGER NOT NULL REFERENCES volunteer_permissions(id) ON DELETE CASCADE,
                allowed BOOLEAN NOT NULL DEFAULT FALSE,
                granted_by VARCHAR(255),
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(volunteer_id, permission_id)
            )
        `);

        // Add rbac_role_id column to volunteers table if missing
        const rbacRoleCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'volunteers' AND column_name = 'rbac_role_id'
        `);
        if (rbacRoleCheck.rows.length === 0) {
            await client.query(`
                ALTER TABLE volunteers ADD COLUMN rbac_role_id INTEGER 
                REFERENCES volunteer_rbac_roles(id) ON DELETE SET NULL
            `);
            console.log('✅ Added rbac_role_id column to volunteers');
        }

        // ════════════════════════════════════════════════════════════════
        // Volunteer Invite Pipeline Tables
        // ════════════════════════════════════════════════════════════════

        // Add invite_id to volunteer_applications if missing
        const inviteIdCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'volunteer_applications' AND column_name = 'invite_id'
        `);
        if (inviteIdCheck.rows.length === 0) {
            await client.query(`
                ALTER TABLE volunteer_applications ADD COLUMN invite_id INTEGER 
                REFERENCES volunteer_invites(id) ON DELETE SET NULL
            `);
            console.log('✅ Added invite_id to volunteer_applications');
        }

        // Create approved_volunteers table for tracking approved but not-yet-registered volunteers
        await client.query(`
            CREATE TABLE IF NOT EXISTS approved_volunteers (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(120),
                last_name VARCHAR(120),
                role_id INTEGER REFERENCES volunteer_rbac_roles(id) ON DELETE SET NULL,
                application_id INTEGER REFERENCES volunteer_applications(id) ON DELETE SET NULL,
                approved_by VARCHAR(255),
                approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activated_at TIMESTAMP NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ PostgreSQL tables initialized');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
    } finally {
        if (client) {
            client.release();
        }
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