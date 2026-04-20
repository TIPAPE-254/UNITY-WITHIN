/**
 * RBAC Seeding Script
 * 
 * Initializes the volunteer RBAC system with:
 *   - 6 volunteer roles (Community Listener, Mental Health Advocate, etc.)
 *   - Permissions for each role
 *   - Permission categories and descriptions
 */

import { pool } from './db.js';

// ────────────────────────────────────────────────────────────────
// PERMISSIONS DEFINITION
// ────────────────────────────────────────────────────────────────

const PERMISSIONS = [
  // Peer Support / Listening
  { name: 'start-session', display: 'Start Session', category: 'peer-support', desc: 'Can initiate peer support sessions' },
  { name: 'voice-call', display: 'Voice Calls', category: 'peer-support', desc: 'Can conduct voice calls' },
  { name: 'video-call', display: 'Video Calls', category: 'peer-support', desc: 'Can conduct video calls' },
  { name: 'schedule', display: 'Schedule Sessions', category: 'peer-support', desc: 'Can schedule support sessions' },

  // Creating & Content
  { name: 'create', display: 'Create Content', category: 'content', desc: 'Can create new content' },
  { name: 'create_post', display: 'Create Posts', category: 'content', desc: 'Can create new posts' },
  { name: 'edit-own-post', display: 'Edit Own Posts', category: 'content', desc: 'Can edit their own posts' },
  { name: 'approvals', display: 'Approve Content', category: 'content', desc: 'Can approve pending content' },
  { name: 'templates', display: 'Use Templates', category: 'content', desc: 'Access content templates' },
  { name: 'ideas', display: 'Share Ideas', category: 'content', desc: 'Can submit content ideas' },

  // Events & Campaigns
  { name: 'campaigns', display: 'Manage Campaigns', category: 'campaigns', desc: 'Can manage campaigns' },
  { name: 'events', display: 'Manage Events', category: 'campaigns', desc: 'Can manage events' },
  { name: 'create_event', display: 'Create Events', category: 'campaigns', desc: 'Can create new events' },
  { name: 'approve_event', display: 'Approve Events', category: 'campaigns', desc: 'Can approve pending events' },
  { name: 'schedule-event', display: 'Schedule Events', category: 'campaigns', desc: 'Can schedule events' },

  // Outreach & Partnerships
  { name: 'partners', display: 'Manage Partners', category: 'outreach', desc: 'Can manage partnerships' },
  { name: 'materials', display: 'Access Materials', category: 'outreach', desc: 'Can access outreach materials' },
  { name: 'reporting', display: 'Create Reports', category: 'outreach', desc: 'Can create outreach reports' },

  // Wellness & Programs
  { name: 'programs', display: 'Manage Programs', category: 'wellness', desc: 'Can manage wellness programs' },
  { name: 'lead', display: 'Lead Sessions', category: 'wellness', desc: 'Can lead wellness sessions' },
  { name: 'feedback', display: 'Collect Feedback', category: 'wellness', desc: 'Can collect user feedback' },

  // Tech & Support
  { name: 'tickets', display: 'Manage Tickets', category: 'tech', desc: 'Can manage support tickets' },
  { name: 'kb', display: 'Create KB Articles', category: 'tech', desc: 'Can create knowledge base articles' },
  { name: 'report', display: 'Report Issues', category: 'tech', desc: 'Can report technical issues' },
  { name: 'stats', display: 'View Stats', category: 'tech', desc: 'Can view technical statistics' },

  // Admin & Learning
  { name: 'training', display: 'Access Training', category: 'admin', desc: 'Can access training materials' },
  { name: 'resources', display: 'View Resources', category: 'admin', desc: 'Can view learning resources' },
  { name: 'share', display: 'Share Content', category: 'admin', desc: 'Can share content' },
  { name: 'analytics', display: 'View Analytics', category: 'admin', desc: 'Can view analytics dashboards' },
];

// ────────────────────────────────────────────────────────────────
// ROLES DEFINITION
// ────────────────────────────────────────────────────────────────

const ROLES = [
  {
    name: 'community_listener',
    display: 'Community Listener',
    desc: 'Provides peer support and listening services',
    permissions: [
      'start-session',
      'schedule',
      'training',
      'resources',
      'voice-call',
      'video-call'
    ]
  },
  {
    name: 'mental_health_advocate',
    display: 'Mental Health Advocate',
    desc: 'Creates campaigns and shares mental health content',
    permissions: [
      'campaigns',
      'share',
      'events',
      'analytics',
      'training',
      'resources'
    ]
  },
  {
    name: 'outreach_ambassador',
    display: 'Outreach Ambassador',
    desc: 'Manages partnerships and outreach initiatives',
    permissions: [
      'partners',
      'schedule-event',
      'materials',
      'reporting',
      'events',
      'resources',
      'create_event',
      'training'
    ]
  },
  {
    name: 'content_creator',
    display: 'Content & Story Volunteer',
    desc: 'Creates and curates content',
    permissions: [
      'create',
      'create_post',
      'edit-own-post',
      'templates',
      'ideas',
      'training',
      'resources',
      'approvals'
    ]
  },
  {
    name: 'wellness_support',
    display: 'Wellness Program Support',
    desc: 'Supports wellness programs and initiatives',
    permissions: [
      'programs',
      'lead',
      'feedback',
      'training',
      'resources',
      'events'
    ]
  },
  {
    name: 'tech_support',
    display: 'Tech Support Volunteer',
    desc: 'Provides technical support and testing',
    permissions: [
      'tickets',
      'kb',
      'report',
      'stats',
      'training',
      'resources'
    ]
  }
];

// ────────────────────────────────────────────────────────────────
// SEEDING LOGIC
// ────────────────────────────────────────────────────────────────

async function seedRBAC() {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // 1. Check if permissions already seeded
    const permCount = await client.query('SELECT COUNT(*) as total FROM volunteer_permissions');
    const hasPermissions = Number(permCount.rows?.[0]?.total || 0) > 0;

    if (!hasPermissions) {
      console.log('🌱 Seeding permissions...');
      for (const perm of PERMISSIONS) {
        await client.query(`
          INSERT INTO volunteer_permissions (name, display_name, category, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (name) DO NOTHING
        `, [perm.name, perm.display, perm.category, perm.desc]);
      }
      console.log(`✅ Seeded ${PERMISSIONS.length} permissions`);
    }

    // 2. Check if roles already seeded
    const roleCount = await client.query('SELECT COUNT(*) as total FROM volunteer_rbac_roles');
    const hasRoles = Number(roleCount.rows?.[0]?.total || 0) > 0;

    if (!hasRoles) {
      console.log('🌱 Seeding roles...');
      for (const role of ROLES) {
        const result = await client.query(`
          INSERT INTO volunteer_rbac_roles (name, display_name, description, is_system)
          VALUES ($1, $2, $3, true)
          ON CONFLICT (name) DO NOTHING
          RETURNING id
        `, [role.name, role.display, role.desc]);

        const roleId = result.rows[0]?.id;
        if (roleId) {
          // Link permissions to role
          for (const permName of role.permissions) {
            const permResult = await client.query(`
              SELECT id FROM volunteer_permissions WHERE name = $1
            `, [permName]);

            if (permResult.rows.length > 0) {
              const permId = permResult.rows[0].id;
              await client.query(`
                INSERT INTO volunteer_role_permissions (role_id, permission_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
              `, [roleId, permId]);
            }
          }
        }
      }
      console.log(`✅ Seeded ${ROLES.length} roles with permissions`);
    }

    await client.query('COMMIT');
    console.log('✅ RBAC seeding complete!');
    return true;
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ RBAC seeding failed:', error.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedRBAC().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { seedRBAC };
