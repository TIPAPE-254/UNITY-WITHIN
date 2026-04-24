/**
 * Migrate Existing Approved Volunteers to New Pipeline
 * 
 * This script ensures previously approved volunteers from older flows are
 * consistently represented across:
 * 1) approved_volunteers (approval source of truth)
 * 2) volunteers (active volunteer profile)
 * 3) users.role = 'volunteer' (portal visibility)
 * 
 * Usage: node migrate_approved_volunteers.js
 */

import { pool } from './db.js';

function splitName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return { firstName: 'Volunteer', lastName: '' };
  }

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || 'Volunteer',
    lastName: parts.slice(1).join(' ') || '',
  };
}

function resolveDefaultRoleId(categoryOrRole) {
  const raw = String(categoryOrRole || '').trim().toLowerCase();
  if (!raw) return 1;

  const mappings = [
    { keys: ['listener', 'community listener', 'peer support'], roleId: 1 },
    { keys: ['advocate', 'mental health advocate'], roleId: 2 },
    { keys: ['ambassador', 'outreach ambassador', 'outreach'], roleId: 3 },
    { keys: ['content', 'story'], roleId: 4 },
    { keys: ['wellness'], roleId: 5 },
    { keys: ['tech', 'support'], roleId: 6 },
  ];

  for (const mapping of mappings) {
    if (mapping.keys.some((key) => raw.includes(key))) {
      return mapping.roleId;
    }
  }

  return 1;
}

async function migrateApprovedVolunteers() {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    console.log('Scanning legacy approval sources...');

    // Source A: volunteers table with approved/active status
    const volunteersSource = await client.query(`
      SELECT
        id,
        email,
        name,
        phone,
        county,
        skills,
        category,
        availability,
        work_preference,
        mental_health_context,
        motivation,
        status,
        matched_role_id,
        rbac_role_id,
        created_at
      FROM volunteers
      WHERE LOWER(COALESCE(status, '')) IN ('approved', 'active')
        AND email IS NOT NULL
      ORDER BY created_at DESC
    `);

    // Source B: approved/active applications that may not yet have volunteer rows
    const applicationsSource = await client.query(`
      SELECT
        id,
        email,
        first_name,
        last_name,
        phone,
        location,
        skills,
        category,
        availability,
        work_preference,
        mental_health_context,
        why_volunteer,
        status,
        created_at
      FROM volunteer_applications
      WHERE LOWER(COALESCE(status, '')) IN ('approved', 'active')
        AND email IS NOT NULL
      ORDER BY created_at DESC
    `);

    console.log(`Found ${volunteersSource.rows.length} approved/active volunteers`);
    console.log(`Found ${applicationsSource.rows.length} approved/active applications`);

    const candidates = new Map();

    for (const row of volunteersSource.rows) {
      const email = String(row.email || '').trim().toLowerCase();
      if (!email || candidates.has(email)) continue;

      const names = splitName(row.name);
      candidates.set(email, {
        source: 'volunteers',
        email,
        firstName: names.firstName,
        lastName: names.lastName,
        fullName: String(row.name || '').trim() || `${names.firstName} ${names.lastName}`.trim(),
        phone: row.phone || null,
        county: row.county || null,
        skills: row.skills || null,
        category: row.category || null,
        availability: row.availability || null,
        workPreference: row.work_preference || null,
        mentalHealthContext: row.mental_health_context || null,
        motivation: row.motivation || null,
        approvedAt: row.created_at || new Date(),
        status: String(row.status || '').toLowerCase() === 'active' ? 'active' : 'approved',
        roleId: row.rbac_role_id || null,
        matchedRoleId: row.matched_role_id || null,
        applicationId: null,
      });
    }

    for (const row of applicationsSource.rows) {
      const email = String(row.email || '').trim().toLowerCase();
      if (!email || candidates.has(email)) continue;

      const firstName = String(row.first_name || '').trim() || 'Volunteer';
      const lastName = String(row.last_name || '').trim();
      const fullName = `${firstName} ${lastName}`.trim();
      candidates.set(email, {
        source: 'applications',
        email,
        firstName,
        lastName,
        fullName: fullName || firstName,
        phone: row.phone || null,
        county: row.location || null,
        skills: Array.isArray(row.skills) ? JSON.stringify(row.skills) : (row.skills || null),
        category: row.category || null,
        availability: row.availability || null,
        workPreference: row.work_preference || null,
        mentalHealthContext: row.mental_health_context || null,
        motivation: row.why_volunteer || null,
        approvedAt: row.created_at || new Date(),
        status: String(row.status || '').toLowerCase() === 'active' ? 'active' : 'approved',
        roleId: null,
        matchedRoleId: null,
        applicationId: row.id,
      });
    }

    let migrated = 0;
    let skipped = 0;
    let usersUpdated = 0;

    for (const candidate of candidates.values()) {
      const resolvedRoleId = candidate.roleId || resolveDefaultRoleId(candidate.category);

      // Ensure approved_volunteers record exists and is refreshed
      const checkResult = await client.query(`
        SELECT id FROM approved_volunteers
        WHERE LOWER(email) = LOWER($1)
      `, [candidate.email]);

      if (checkResult.rows.length > 0) {
        skipped++;
      } else {
        migrated++;
      }

      await client.query(`
        INSERT INTO approved_volunteers (
          email, first_name, last_name, role_id, application_id,
          approved_by, approved_at, activated_at, notes
        ) VALUES ($1, $2, $3, $4, $5, 'migration', $6, NOW(), $7)
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role_id = COALESCE(approved_volunteers.role_id, EXCLUDED.role_id),
          application_id = COALESCE(approved_volunteers.application_id, EXCLUDED.application_id),
          approved_by = 'migration',
          approved_at = COALESCE(approved_volunteers.approved_at, EXCLUDED.approved_at),
          activated_at = COALESCE(approved_volunteers.activated_at, NOW()),
          notes = EXCLUDED.notes
      `, [
        candidate.email,
        candidate.firstName,
        candidate.lastName,
        resolvedRoleId,
        candidate.applicationId,
        candidate.approvedAt,
        `Migrated from ${candidate.source} legacy pipeline`,
      ]);

      // Ensure volunteer profile exists and is marked active
      await client.query(`
        INSERT INTO volunteers (
          name, email, phone, county, skills, category, availability,
          work_preference, mental_health_context, motivation,
          status, rbac_role_id, matched_role_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11, $12)
        ON CONFLICT (email) DO UPDATE SET
          name = COALESCE(volunteers.name, EXCLUDED.name),
          phone = COALESCE(volunteers.phone, EXCLUDED.phone),
          county = COALESCE(volunteers.county, EXCLUDED.county),
          skills = COALESCE(volunteers.skills, EXCLUDED.skills),
          category = COALESCE(volunteers.category, EXCLUDED.category),
          availability = COALESCE(volunteers.availability, EXCLUDED.availability),
          work_preference = COALESCE(volunteers.work_preference, EXCLUDED.work_preference),
          mental_health_context = COALESCE(volunteers.mental_health_context, EXCLUDED.mental_health_context),
          motivation = COALESCE(volunteers.motivation, EXCLUDED.motivation),
          status = 'active',
          rbac_role_id = COALESCE(volunteers.rbac_role_id, EXCLUDED.rbac_role_id),
            matched_role_id = COALESCE(volunteers.matched_role_id, EXCLUDED.matched_role_id)
      `, [
        candidate.fullName,
        candidate.email,
        candidate.phone,
        candidate.county,
        candidate.skills,
        candidate.category,
        candidate.availability,
        candidate.workPreference,
        candidate.mentalHealthContext,
        candidate.motivation,
        resolvedRoleId,
        candidate.matchedRoleId,
      ]);

      // Ensure users.role is volunteer for immediate portal visibility
      const updateUserResult = await client.query(
        `UPDATE users SET role = 'volunteer' WHERE LOWER(email) = LOWER($1)`,
        [candidate.email],
      );
      usersUpdated += Number(updateUserResult.rowCount || 0);

      console.log(`Migrated ${candidate.email} from ${candidate.source}`);
    }

    await client.query('COMMIT');

    console.log('\nMigration complete');
    console.log(`  Candidates processed: ${candidates.size}`);
    console.log(`  New approved records: ${migrated}`);
    console.log(`  Existing approved records updated: ${skipped}`);
    console.log(`  Users promoted to volunteer: ${usersUpdated}`);

    // Show a small sample for verification
    const allApprovedResult = await client.query(`
      SELECT email, first_name, last_name, role_id, activated_at
      FROM approved_volunteers
      ORDER BY approved_at DESC
      LIMIT 20
    `);

    console.log('\nTop 20 approved volunteers after migration:');
    console.log('-'.repeat(70));
    allApprovedResult.rows.forEach((row, index) => {
      const status = row.activated_at ? 'Activated' : 'Pending';
      console.log(`${index + 1}. ${row.email} (${row.first_name} ${row.last_name}) - ${status}`);
    });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // no-op
      }
    }
    console.error('Migration error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

// Run migration
migrateApprovedVolunteers()
  .then(() => {
    console.log('\nDone. Approved legacy volunteers are now synced for portal access.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
