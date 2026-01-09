
import { pool } from './db.js';

const newRooms = [
    ['The Hustle', 'Navigating career, finances, and ambition', 'public'],
    ['Heartbreak Hotel', 'Healing from relationship loss', 'support'],
    ['Exam Stress', 'Academic pressure and study fatigue', 'support'],
    ['Midnight Thoughts', 'For when you can\'t sleep', 'public']
];

async function updateRooms() {
    try {
        console.log('🔄 Seeding new rooms...');
        for (const room of newRooms) {
            // Check if exists
            const [rows] = await pool.query('SELECT id FROM chat_rooms WHERE name = ?', [room[0]]);
            if (rows.length === 0) {
                await pool.query('INSERT INTO chat_rooms (name, description, type) VALUES (?, ?, ?)', room);
                console.log(`✅ Created room: ${room[0]}`);
            } else {
                console.log(`ℹ️ Room already exists: ${room[0]}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding rooms:', error);
        process.exit(1);
    }
}

updateRooms();
