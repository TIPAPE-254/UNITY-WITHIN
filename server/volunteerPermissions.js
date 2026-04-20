/**
 * Volunteer Permission Engine
 * 
 * Resolves permissions for a volunteer by merging:
 *   1. Role-based permissions (from volunteer_rbac_roles → volunteer_role_permissions)
 *   2. Per-user overrides (from volunteer_user_permissions)
 * 
 * Merge logic:
 *   - Role permissions set the baseline (all = true)
 *   - User overrides can GRANT (allowed=true) or REVOKE (allowed=false)
 *   - Overrides always win over role defaults
 */

import { pool } from './db.js';

// ── In-Memory Cache ──
const permissionCache = new Map(); // volunteerId → { permissions: Map, timestamp: number }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get all resolved permissions for a volunteer.
 * Returns a Map<permissionName, boolean>.
 */
export async function getVolunteerPermissions(volunteerId) {
    // Check cache
    const cached = permissionCache.get(volunteerId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        return cached.permissions;
    }

    try {
        // 1. Get role-based permissions
        const rolePermsResult = await pool.query(`
            SELECT vp.name
            FROM volunteer_role_permissions vrp
            JOIN volunteer_permissions vp ON vrp.permission_id = vp.id
            JOIN volunteers v ON v.rbac_role_id = vrp.role_id
            WHERE v.id = $1
        `, [volunteerId]);

        const rolePerms = rolePermsResult.rows.map(r => r.name);

        // 2. Get user-specific overrides
        const overridesResult = await pool.query(`
            SELECT vp.name, vup.allowed
            FROM volunteer_user_permissions vup
            JOIN volunteer_permissions vp ON vup.permission_id = vp.id
            WHERE vup.volunteer_id = $1
        `, [volunteerId]);

        const overrides = overridesResult.rows.map(r => ({
            permission: r.name,
            allowed: r.allowed
        }));

        // 3. Merge
        const merged = mergePermissions(rolePerms, overrides);

        // Cache the result
        permissionCache.set(volunteerId, {
            permissions: merged,
            timestamp: Date.now()
        });

        return merged;
    } catch (error) {
        console.error('Error resolving volunteer permissions:', error);
        return new Map();
    }
}

/**
 * Check if a volunteer has a specific permission.
 */
export async function volunteerHasPermission(volunteerId, permissionName) {
    const permissions = await getVolunteerPermissions(volunteerId);
    return permissions.get(permissionName) === true;
}

/**
 * Merge role permissions with user overrides.
 * 
 * @param {string[]} rolePerms - Permission names from the role
 * @param {{ permission: string, allowed: boolean }[]} overrides - User-level overrides
 * @returns {Map<string, boolean>} - Final resolved permission map
 */
export function mergePermissions(rolePerms, overrides) {
    const map = new Map();

    // Step 1: All role permissions → true
    for (const perm of rolePerms) {
        map.set(perm, true);
    }

    // Step 2: Apply overrides (these ALWAYS win)
    for (const override of overrides) {
        map.set(override.permission, override.allowed);
    }

    return map;
}

/**
 * Clear the permission cache for a specific volunteer.
 * Call this whenever admin changes permissions or role.
 */
export function clearVolunteerPermissionCache(volunteerId) {
    if (volunteerId) {
        permissionCache.delete(volunteerId);
    } else {
        // Clear everything
        permissionCache.clear();
    }
}

/**
 * Get a volunteer record by email.
 */
export async function getVolunteerByEmail(email) {
    if (!email) return null;
    try {
        const result = await pool.query(
            "SELECT id, rbac_role_id, status FROM volunteers WHERE LOWER(email) = LOWER($1) LIMIT 1",
            [email]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching volunteer by email:', error);
        return null;
    }
}

/**
 * Get all defined volunteer permissions (for admin UI).
 */
export async function getAllVolunteerPermissions() {
    try {
        const result = await pool.query(
            "SELECT id, name, display_name, category, description FROM volunteer_permissions ORDER BY category, name"
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching all permissions:', error);
        return [];
    }
}

/**
 * Get all volunteer RBAC roles with their assigned permissions.
 */
export async function getVolunteerRolesWithPermissions() {
    try {
        const roles = await pool.query(
            "SELECT id, name, display_name, description, is_system FROM volunteer_rbac_roles ORDER BY name"
        );

        const result = [];
        for (const role of roles.rows) {
            const perms = await pool.query(`
                SELECT vp.id, vp.name, vp.display_name, vp.category
                FROM volunteer_role_permissions vrp
                JOIN volunteer_permissions vp ON vrp.permission_id = vp.id
                WHERE vrp.role_id = $1
                ORDER BY vp.category, vp.name
            `, [role.id]);

            result.push({
                ...role,
                permissions: perms.rows
            });
        }

        return result;
    } catch (error) {
        console.error('Error fetching roles with permissions:', error);
        return [];
    }
}

/**
 * Get a volunteer's resolved permissions as a plain object (for API response).
 * Returns { permissions: string[], role: { name, display_name }, overrides: [...] }
 */
export async function getVolunteerPermissionSummary(volunteerId) {
    try {
        const permissions = await getVolunteerPermissions(volunteerId);

        // Get role info
        const roleResult = await pool.query(`
            SELECT vrr.name, vrr.display_name
            FROM volunteers v
            JOIN volunteer_rbac_roles vrr ON v.rbac_role_id = vrr.id
            WHERE v.id = $1
        `, [volunteerId]);

        // Get overrides
        const overrides = await pool.query(`
            SELECT vp.name as permission, vup.allowed, vup.granted_by, vup.reason, vup.created_at
            FROM volunteer_user_permissions vup
            JOIN volunteer_permissions vp ON vup.permission_id = vp.id
            WHERE vup.volunteer_id = $1
        `, [volunteerId]);

        // Convert Map to array of granted permission names
        const grantedPermissions = [];
        for (const [name, allowed] of permissions) {
            if (allowed) grantedPermissions.push(name);
        }

        return {
            permissions: grantedPermissions,
            role: roleResult.rows[0] || null,
            overrides: overrides.rows
        };
    } catch (error) {
        console.error('Error fetching permission summary:', error);
        return { permissions: [], role: null, overrides: [] };
    }
}
