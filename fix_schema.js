import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
};

async function fixSchema() {
    try {
        const db = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');

        try {
            await db.execute('ALTER TABLE users ADD COLUMN firstName VARCHAR(255)');
            console.log('✅ Added firstName column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ firstName column already exists');
            } else {
                console.error('❌ Failed to add firstName:', err);
            }
        }

        try {
            await db.execute('ALTER TABLE users ADD COLUMN emergencyContact VARCHAR(255)');
            console.log('✅ Added emergencyContact column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ emergencyContact column already exists');
            } else {
                console.error('❌ Failed to add emergencyContact:', err);
            }
        }

        await db.end();
    } catch (error) {
        console.error('❌ Schema fix failed:', error);
        process.exit(1);
    }
}

fixSchema();
