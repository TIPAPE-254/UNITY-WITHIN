import { pool } from './db.js';

async function checkUser() {
    const email = 'lepiromatayo@gmail.com';
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        console.log('User Record:', rows[0]);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkUser();
