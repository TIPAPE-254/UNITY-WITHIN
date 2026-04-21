/**
 * Migrate Existing Approved Volunteers to New Pipeline
 * 
 * This script ensures that users like Cynthia who are already approved
 * are properly registered in the approved_volunteers table so they can
 * auto-activate when logging in.
 * 
 * Usage: node migrate_approved_volunteers.js
 */

import { pool } from './db.js';

async function migrateApprovedVolunteers() {
  let client;
  try {
    client = await pool.connect();

    console.log('🔍 Scanning for existing approved volunteers...');

    // Find volunteers that might be approved but not in the new table
    const existingVolunteersResult = await client.query(`
      SELECT id, email, name, role, status
      FROM volunteers
      WHERE status = 'active' OR role IS NOT NULL
      ORDER BY created_at DESC
    `);

    console.log(`Found ${existingVolunteersResult.rows.length} existing volunteer records`);

    let migrated = 0;
    let skipped = 0;

    for (const volunteer of existingVolunteersResult.rows) {
      // Check if already in approved_volunteers
      const checkResult = await client.query(`
        SELECT id FROM approved_volunteers
        WHERE LOWER(email) = LOWER($1)
      `, [volunteer.email]);

      if (checkResult.rows.length > 0) {
        console.log(`✓ ${volunteer.email} already in approved_volunteers (skipped)`);
        skipped++;
        continue;
      }

      // Get the volunteer's name parts
      const nameParts = (volunteer.name || '').split(' ');
      const firstName = nameParts[0] || 'Volunteer';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Try to find a role for them (default to Community Listener)
      let roleId = 1; // Default to Community Listener
      const roleNameMap = {
        'listener': 1,
        'community listener': 1,
        'advocate': 2,
        'mental health advocate': 2,
        'ambassador': 3,
        'outreach ambassador': 3,
        'content': 4,
        'content & story volunteer': 4,
        'wellness': 5,
        'wellness program support': 5,
        'tech': 6,
        'tech support': 6,
      };

      if (volunteer.role && roleNameMap[volunteer.role.toLowerCase()]) {
        roleId = roleNameMap[volunteer.role.toLowerCase()];
      }

      // Add to approved_volunteers table
      await client.query(`
        INSERT INTO approved_volunteers (
          email, first_name, last_name, role_id, 
          approved_by, approved_at, activated_at, notes
        ) VALUES ($1, $2, $3, $4, 'migration', NOW(), NOW(), $5)
        ON CONFLICT (email) DO NOTHING
      `, [
        volunteer.email,
        firstName,
        lastName,
        roleId,
        'Migrated from existing volunteers table'
      ]);

      console.log(`✓ Migrated: ${volunteer.email} (${firstName} ${lastName}) → Role ${roleId}`);
      migrated++;
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);

    // List all approved volunteers now
    const allApprovedResult = await client.query(`
      SELECT email, first_name, last_name, role_id, activated_at
      FROM approved_volunteers
      ORDER BY approved_at DESC
      LIMIT 20
    `);

    console.log(`\n📋 Top 20 Approved Volunteers:`);
    console.log('─'.repeat(70));
    allApprovedResult.rows.forEach((row, index) => {
      const status = row.activated_at ? '✓ Activated' : '⏳ Pending';
      console.log(`${index + 1}. ${row.email} (${row.first_name} ${row.last_name}) - ${status}`);
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

// Run migration
migrateApprovedVolunteers()
  .then(() => {
    console.log('\n🎉 Done! Approved volunteers can now auto-activate on login.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
