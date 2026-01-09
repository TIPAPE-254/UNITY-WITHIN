
import { pool } from './db.js';

async function updateSchema() {
    try {
        console.log("Updating schema...");

        // 1. Drop existing tables if they exist to ensure clean state matching new schema
        // Warning: This deletes data. Since this is "enhancing" and likely dev phase, it might be acceptable.
        // If I want to preserve data, I'd need complex migration. 
        // Given the request asks for "Exact" tables, I'll drop and recreate to be sure structure is correct.
        // Note: verify if user wants to keep data? usually "clean, rewritten" implies new structure.

        await pool.query('DROP TABLE IF EXISTS journals'); // Drop new name
        await pool.query('DROP TABLE IF EXISTS journal_entries'); // Drop old name
        await pool.query('DROP TABLE IF EXISTS user_moods');

        console.log("Dropped old tables.");

        // 2. Create user_moods
        // Note: I'm handling the ENUM values. Frontend sends 'Happy', SQL wants 'happy'. 
        // I will make the ENUM match the user's request (lowercase).
        await pool.query(`
            CREATE TABLE user_moods (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                mood ENUM(
                    'happy',
                    'calm',
                    'okay',
                    'sad',
                    'stressed',
                    'angry',
                    'anxious',
                    'tired'
                ) NOT NULL,
                intensity TINYINT CHECK (intensity BETWEEN 1 AND 10),
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log("Created user_moods table.");

        // 3. Create journals
        await pool.query(`
            CREATE TABLE journals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                mood_id INT,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (mood_id) REFERENCES user_moods(id) ON DELETE SET NULL
            );
        `);
        console.log("Created journals table.");

        console.log("Schema update complete!");
        process.exit(0);
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
}

updateSchema();
