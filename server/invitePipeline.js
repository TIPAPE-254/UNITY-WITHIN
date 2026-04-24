/**
 * Volunteer Invite Pipeline Endpoints
 * 
 * Flow:
 * 1. Admin creates invite (existing endpoint)
 * 2. Volunteer opens /volunteer-invite/{token} (verify & prefill)
 * 3. Volunteer submits form (create application + link to invite)
 * 4. Admin reviews application
 * 5. Admin approves (creates approved_volunteers entry)
 * 6. User logs in / signs up (activates volunteer role)
 */

import express from 'express';
import { pool } from './db.js';
import { sendEmail } from './brevo.js';

const app = express();

// ════════════════════════════════════════════════════════════════
// Endpoint 1: Verify Invite Token → Get Prefill Data
// ════════════════════════════════════════════════════════════════

export async function handleVerifyInvite(req, res) {
  const { token } = req.params;

  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Invite token is required'
      });
    }

    const result = await pool.query(`
      SELECT id, email, status, expires_at
      FROM volunteer_invites
      WHERE token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid invite token',
        reason: 'not_found'
      });
    }

    const invite = result.rows[0];

    // Check if already used
    if (invite.status === 'used') {
      return res.status(410).json({
        success: false,
        error: 'This invite has already been used',
        reason: 'already_used'
      });
    }

    // Check if approved
    if (invite.status === 'approved') {
      return res.status(410).json({
        success: false,
        error: 'This invite has already been approved',
        reason: 'already_approved'
      });
    }

    // Check if expired
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'This invite has expired',
        reason: 'expired',
        expiresAt: expiresAt.toISOString()
      });
    }

    // Return invite details for prefilling
    return res.json({
      success: true,
      invite: {
        token,
        email: invite.email,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error verifying invite:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify invite'
    });
  }
}

// ════════════════════════════════════════════════════════════════
// Endpoint 2: Submit Volunteer Application Form
// ════════════════════════════════════════════════════════════════

export async function handleSubmitApplication(req, res) {
  const { token } = req.params;
  const {
    email,
    firstName,
    lastName,
    phone,
    location,
    availability,
    category,
    skills,
    whyVolunteer,
    mentalHealthContext,
    workPreference,
    notes
  } = req.body || {};

  try {
    // Step 1: Verify invite
    const inviteResult = await pool.query(`
      SELECT id, email, status, expires_at
      FROM volunteer_invites
      WHERE token = $1
    `, [token]);

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid invite token'
      });
    }

    const invite = inviteResult.rows[0];

    // Step 2: Validate email matches (CRITICAL)
    if (email.toLowerCase() !== invite.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Email does not match the invited email',
        detail: `Invited: ${invite.email}, Submitted: ${email}`
      });
    }

    // Step 3: Check invite status
    if (invite.status !== 'pending') {
      return res.status(410).json({
        success: false,
        error: `Cannot submit: invite status is "${invite.status}"`
      });
    }

    // Step 4: Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email'
      });
    }

    // Step 5: Create application linked to invite
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      const appResult = await client.query(`
        INSERT INTO volunteer_applications (
          first_name, last_name, email, phone, location, 
          availability, category, skills, why_volunteer, 
          mental_health_context, work_preference, notes, 
          status, invite_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING id, email, status, created_at
      `, [
        firstName,
        lastName,
        email,
        phone || null,
        location || null,
        availability || null,
        category || null,
        Array.isArray(skills) ? JSON.stringify(skills) : (skills || null),
        whyVolunteer || null,
        mentalHealthContext || null,
        workPreference || null,
        notes || null,
        'pending_admin_review',
        invite.id
      ]);

      const application = appResult.rows[0];

      // Step 6: Mark invite as "used"
      await client.query(`
        UPDATE volunteer_invites
        SET status = 'used'
        WHERE id = $1
      `, [invite.id]);

      await client.query('COMMIT');

      return res.json({
        success: true,
        application: {
          id: application.id,
          email: application.email,
          status: application.status,
          createdAt: application.created_at
        },
        message: 'Application submitted successfully. Admin will review your form.'
      });
    } catch (dbError) {
      if (client) await client.query('ROLLBACK');
      throw dbError;
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    console.error('Error submitting application:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    });
  }
}

// ════════════════════════════════════════════════════════════════
// Endpoint 3: Admin Approves Application + Assign Role
// ════════════════════════════════════════════════════════════════

export async function handleApproveApplicationWithRole(req, res) {
  const { applicationId } = req.params;
  const { rbacRoleId, notes } = req.body || {};
  const adminEmail = req.user?.email || 'admin';

  try {
    if (!rbacRoleId) {
      return res.status(400).json({
        success: false,
        error: 'rbacRoleId is required'
      });
    }

    // Verify role exists
    const roleCheck = await pool.query(`
      SELECT id FROM volunteer_rbac_roles WHERE id = $1
    `, [rbacRoleId]);

    if (roleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // Get application
      const appResult = await client.query(`
        SELECT id, email, first_name, last_name, status, invite_id
        FROM volunteer_applications
        WHERE id = $1
      `, [applicationId]);

      if (appResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      const application = appResult.rows[0];

      // Create entry in approved_volunteers table
      // This holds the approval data until user actually signs up/logs in
      const approvedResult = await client.query(`
        INSERT INTO approved_volunteers (
          email, first_name, last_name, role_id, application_id, 
          approved_by, approved_at, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
        ON CONFLICT (email) DO UPDATE SET
          role_id = EXCLUDED.role_id,
          application_id = EXCLUDED.application_id,
          approved_by = EXCLUDED.approved_by,
          approved_at = NOW(),
          notes = EXCLUDED.notes
        RETURNING id
      `, [
        application.email,
        application.first_name,
        application.last_name,
        rbacRoleId,
        applicationId,
        adminEmail,
        notes || null
      ]);

      // Update application status
      await client.query(`
        UPDATE volunteer_applications
        SET status = 'approved'
        WHERE id = $1
      `, [applicationId]);

      // Mark invite as approved
      if (application.invite_id) {
        await client.query(`
          UPDATE volunteer_invites
          SET status = 'approved'
          WHERE id = $1
        `, [application.invite_id]);
      }

      const fullName = `${application.first_name || ''} ${application.last_name || ''}`.trim() || null;
      const normalizedEmail = String(application.email || '').trim().toLowerCase();

      // Promote/create the volunteer record so the portal can see an active volunteer account.
      const volunteerResult = await client.query(
        `INSERT INTO volunteers (
           name, email, phone, county, skills, category, availability,
           work_preference, mental_health_context, motivation, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           county = EXCLUDED.county,
           skills = EXCLUDED.skills,
           category = EXCLUDED.category,
           availability = EXCLUDED.availability,
           work_preference = EXCLUDED.work_preference,
           mental_health_context = EXCLUDED.mental_health_context,
           motivation = EXCLUDED.motivation,
            status = EXCLUDED.status
         RETURNING id`,
        [
          fullName,
          normalizedEmail,
          application.phone || null,
          application.location || null,
          Array.isArray(application.skills) ? JSON.stringify(application.skills) : (application.skills || null),
          application.category || null,
          application.availability || null,
          application.work_preference || null,
          application.mental_health_context || null,
          application.why_volunteer || null,
          'active',
        ],
      );

      await client.query(
        "UPDATE users SET role = $1 WHERE LOWER(email) = LOWER($2)",
        ['volunteer', normalizedEmail],
      );

      // Persist approved volunteer state for login-time activation fallback.
      await client.query(
        `INSERT INTO approved_volunteers (
           email, first_name, last_name, role_id, application_id, approved_by, approved_at, notes
         ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
         ON CONFLICT (email) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role_id = EXCLUDED.role_id,
           application_id = EXCLUDED.application_id,
           approved_by = EXCLUDED.approved_by,
           approved_at = NOW(),
           notes = EXCLUDED.notes`,
        [
          normalizedEmail,
          application.first_name || null,
          application.last_name || null,
          rbacRoleId,
          applicationId,
          adminEmail,
          notes || null,
        ],
      );

      // Make Community Listeners immediately available as peer support listeners.
      const roleResult = await client.query(
        `SELECT name, display_name FROM volunteer_rbac_roles WHERE id = $1 LIMIT 1`,
        [rbacRoleId],
      );
      const roleName = String(roleResult.rows[0]?.name || '').toLowerCase();
      const roleDisplayName = String(roleResult.rows[0]?.display_name || '').toLowerCase();
      const isCommunityListener = roleName.includes('community_listener') || roleDisplayName.includes('community listener');
      if (isCommunityListener || rbacRoleId === 15) {
        await client.query(
          `INSERT INTO peer_support_listeners (volunteer_id, user_email, phone, is_available, approved_at)
           VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP)
           ON CONFLICT(volunteer_id) DO UPDATE SET is_available = TRUE, approved_at = CURRENT_TIMESTAMP`,
          [volunteerResult.rows[0]?.id, normalizedEmail, application.phone || null],
        );
      }

      await client.query('COMMIT');

      // Send approval email
      try {
        const roleResult = await pool.query(`
          SELECT display_name FROM volunteer_rbac_roles WHERE id = $1
        `, [rbacRoleId]);

        const roleName = roleResult.rows[0]?.display_name || 'Volunteer';

        const approvalEmailHtml = `
          <div style="background: #f8f8f8; margin: 0; padding: 24px 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #111111;">
            <div style="max-width: 640px; margin: 0 auto; border: 1px solid #dcfce7; border-radius: 16px; overflow: hidden; background: #ffffff;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 20px 24px;">
                <p style="margin: 0; font-size: 12px; letter-spacing: 1.2px; text-transform: uppercase; color: #ffffff; font-weight: 700;">✓ APPROVED</p>
                <h2 style="margin: 8px 0 0; color: #ffffff; font-size: 22px; line-height: 1.3;">Your Volunteer Application is Approved!</h2>
              </div>
              <div style="padding: 24px; font-size: 14px; line-height: 1.7; color: #111111;">
                <p style="margin: 0 0 12px;">Hi ${application.first_name},</p>
                <p style="margin: 0 0 12px;">Great news! Your volunteer application has been approved by the UNITY WITHIN team.</p>
                
                <div style="margin: 16px 0; padding: 12px; background: #f0fdf4; border-left: 4px solid #10b981; color: #111111;">
                  <p style="margin: 0; font-weight: 600; color: #059669;">Your Role: ${roleName}</p>
                </div>
                
                <p style="margin: 12px 0 0; font-weight: 600;">Next Step:</p>
                <p style="margin: 6px 0 12px;">Simply log in or create an account using the email <strong>${application.email}</strong> to access your volunteer dashboard.</p>
                
                <p style="margin: 12px 0 0; font-size: 12px; color: #666;">If you need any assistance, please contact support@unitywithin.app</p>
              </div>
              <div style="border-top: 1px solid #dcfce7; background: #f0fdf4; padding: 16px 24px;">
                <p style="margin: 0; font-size: 12px; color: #065f46;">UNITY WITHIN • Supporting Mental Health</p>
              </div>
            </div>
          </div>
        `;

        await sendEmail(
          application.email,
          '✓ Your Volunteer Application is Approved!',
          approvalEmailHtml
        );
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Continue - email failure shouldn't block approval
      }

      return res.json({
        success: true,
        message: 'Application approved successfully',
        approved: {
          applicationId,
          email: application.email,
          role: roleName
        }
      });
    } catch (dbError) {
      if (client) await client.query('ROLLBACK');
      throw dbError;
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    console.error('Error approving application:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to approve application'
    });
  }
}

// ════════════════════════════════════════════════════════════════
// Endpoint 4: Check if user is an approved volunteer
// ════════════════════════════════════════════════════════════════

export async function handleCheckApprovedStatus(req, res) {
  const email = req.query.email || (req.user?.email);

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await pool.query(`
      SELECT id, email, first_name, last_name, role_id, approved_at, activated_at
      FROM approved_volunteers
      WHERE LOWER(email) = LOWER($1)
    `, [normalizedEmail]);

    if (result.rows.length === 0) {
      const legacyVolunteerResult = await pool.query(`
        SELECT
          v.id,
          v.email,
          v.status,
          v.rbac_role_id,
          v.matched_role_id,
          vrr.name AS rbac_role_name,
          vrr.display_name AS rbac_role_display_name,
          vr.category AS legacy_role_name,
          vr.title AS legacy_role_display_name
        FROM volunteers v
        LEFT JOIN volunteer_rbac_roles vrr ON v.rbac_role_id = vrr.id
        LEFT JOIN volunteer_roles vr ON v.matched_role_id = vr.id
        WHERE LOWER(v.email) = LOWER($1)
        ORDER BY v.id DESC
        LIMIT 1
      `, [normalizedEmail]);

      if (legacyVolunteerResult.rows.length > 0) {
        const legacyVolunteer = legacyVolunteerResult.rows[0];
        const legacyStatus = String(legacyVolunteer.status || '').toLowerCase();

        if (legacyStatus === 'approved' || legacyStatus === 'active') {
          return res.json({
            success: true,
            isApproved: true,
            approved: {
              id: legacyVolunteer.id,
              email: legacyVolunteer.email,
              firstName: null,
              lastName: null,
              role: {
                id: legacyVolunteer.rbac_role_id || legacyVolunteer.matched_role_id || null,
                name: legacyVolunteer.rbac_role_name || legacyVolunteer.legacy_role_name || 'volunteer',
                display_name: legacyVolunteer.rbac_role_display_name || legacyVolunteer.legacy_role_display_name || 'Volunteer'
              },
              approvedAt: null,
              activatedAt: legacyStatus === 'active' ? new Date().toISOString() : null
            }
          });
        }
      }

      const legacyApplicationResult = await pool.query(`
        SELECT
          id,
          email,
          first_name,
          last_name,
          category,
          status,
          created_at
        FROM volunteer_applications
        WHERE LOWER(email) = LOWER($1)
          AND LOWER(status) IN ('approved', 'active')
        ORDER BY created_at DESC
        LIMIT 1
      `, [normalizedEmail]);

      if (legacyApplicationResult.rows.length > 0) {
        const application = legacyApplicationResult.rows[0];
        return res.json({
          success: true,
          isApproved: true,
          approved: {
            id: application.id,
            email: application.email,
            firstName: application.first_name,
            lastName: application.last_name,
            role: {
              id: null,
              name: String(application.category || 'volunteer').toLowerCase(),
              display_name: application.category || 'Volunteer'
            },
            approvedAt: application.created_at,
            activatedAt: String(application.status || '').toLowerCase() === 'active' ? application.created_at : null
          }
        });
      }

      return res.json({
        success: true,
        isApproved: false
      });
    }

    const approved = result.rows[0];

    // Get role details
    let roleDetails = null;
    if (approved.role_id) {
      const roleResult = await pool.query(`
        SELECT id, name, display_name FROM volunteer_rbac_roles WHERE id = $1
      `, [approved.role_id]);

      if (roleResult.rows.length > 0) {
        roleDetails = roleResult.rows[0];
      }
    }

    return res.json({
      success: true,
      isApproved: true,
      approved: {
        id: approved.id,
        email: approved.email,
        firstName: approved.first_name,
        lastName: approved.last_name,
        role: roleDetails,
        approvedAt: approved.approved_at,
        activatedAt: approved.activated_at
      }
    });
  } catch (error) {
    console.error('Error checking approved status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check status'
    });
  }
}

// ════════════════════════════════════════════════════════════════
// Endpoint 5: Activate Volunteer (called at login/signup)
// ════════════════════════════════════════════════════════════════

export async function handleActivateVolunteer(req, res) {
  const { userId } = req.params;
  const userEmail = req.user?.email;

  try {
    if (!userId || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User ID and email are required'
      });
    }

    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // Get approved volunteer record
      const approvedResult = await client.query(`
        SELECT id, email, role_id, application_id
        FROM approved_volunteers
        WHERE LOWER(email) = LOWER($1) AND activated_at IS NULL
      `, [userEmail]);

      if (approvedResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.json({
          success: true,
          activated: false,
          message: 'No pending volunteer activation for this user'
        });
      }

      const approved = approvedResult.rows[0];

      // Assign role to user/volunteer
      // First, try to find existing volunteer record
      const volunteerResult = await client.query(`
        SELECT id FROM volunteers WHERE email = $1
      `, [userEmail]);

      let volunteerId;
      if (volunteerResult.rows.length > 0) {
        // Update existing volunteer
        volunteerId = volunteerResult.rows[0].id;
        await client.query(`
          UPDATE volunteers
          SET rbac_role_id = $1, status = 'active'
          WHERE id = $2
        `, [approved.role_id, volunteerId]);
      } else {
        // Create new volunteer record
        const newVolResult = await client.query(`
          INSERT INTO volunteers (email, rbac_role_id, status)
          VALUES ($1, $2, 'active')
          RETURNING id
        `, [userEmail, approved.role_id]);

        volunteerId = newVolResult.rows[0].id;
      }

      // Mark as activated
      await client.query(`
        UPDATE approved_volunteers
        SET activated_at = NOW()
        WHERE id = $1
      `, [approved.id]);

      // Also update users table if it exists
      try {
        await client.query(`
          UPDATE users
          SET role = 'volunteer'
          WHERE LOWER(email) = LOWER($1)
        `, [userEmail]);
      } catch (e) {
        // users table might not exist, continue
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        activated: true,
        volunteer: {
          id: volunteerId,
          email: userEmail,
          roleId: approved.role_id
        },
        message: 'Volunteer activation successful'
      });
    } catch (dbError) {
      if (client) await client.query('ROLLBACK');
      throw dbError;
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    console.error('Error activating volunteer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to activate volunteer'
    });
  }
}

export default { handleVerifyInvite, handleSubmitApplication, handleApproveApplicationWithRole, handleCheckApprovedStatus, handleActivateVolunteer };
