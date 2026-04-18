import { pool } from './db.js';

async function makeAdmin() {
    const email = 'lepiromatayo@gmail.com';
    try {
        console.log(`Attempting to make ${email} an admin...`);
        const result = await pool.query('UPDATE users SET role = $1 WHERE email = $2 RETURNING id', ['admin', email]);
        if (result.rows?.length || result.rowCount > 0) {
            console.log(`✅ Success: ${email} is now an ADMIN.`);

            // Verify
            const rows = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', [email]);
            console.log('User details:', rows.rows[0]);
        } else {
            console.log(`⚠️ User ${email} not found in database.`);
            console.log(`Please ask the user to Sign Up on the website first, then run this command again.`);
        }
        process.exit(0);
    } catch (e) {
        console.error('❌ Error updating user role:', e);
        process.exit(1);
    }
}

makeAdmin();
