-- Mark Existing Approved Volunteers for Auto-Activation
-- 
-- This SQL script registers existing approved volunteers in the approved_volunteers table
-- so they can auto-activate when logging in with their email.
--
-- Replace the email addresses and details with your existing volunteers.

-- Make sure the volunteer_rbac_roles table has these roles:
-- SELECT * FROM volunteer_rbac_roles;

-- Example: Add Cynthia as an approved volunteer (Community Listener role)
INSERT INTO approved_volunteers (
  email, 
  first_name, 
  last_name, 
  role_id,
  approved_by,
  approved_at,
  activated_at,
  notes
) VALUES (
  'cynthia@example.com',  -- Change to actual email
  'Cynthia',
  'Name',  
  1,  -- Community Listener role (check your volunteer_rbac_roles for correct ID)
  'admin-migration',
  NOW(),
  NOW(),  -- Already activated
  'Migrated from existing volunteers'
)
ON CONFLICT (email) DO UPDATE SET
  activated_at = COALESCE(approved_volunteers.activated_at, NOW());

-- To add more volunteers, repeat the INSERT statement pattern above
-- or use this template to update multiple at once:

-- UPDATE volunteers 
-- SET role = 'volunteer'
-- WHERE email IN ('cynthia@example.com', 'other@example.com');

-- Verify approved volunteers
SELECT 
  email, 
  first_name, 
  last_name,
  role_id,
  approved_at,
  activated_at,
  CASE WHEN activated_at IS NOT NULL THEN 'Active' ELSE 'Pending' END as status
FROM approved_volunteers
ORDER BY approved_at DESC;

-- Check specific volunteer
SELECT * FROM approved_volunteers 
WHERE LOWER(email) = LOWER('cynthia@example.com');

-- View the role assigned
SELECT 
  av.email,
  av.first_name,
  av.last_name,
  vrr.display_name as role_name,
  av.activated_at
FROM approved_volunteers av
LEFT JOIN volunteer_rbac_roles vrr ON av.role_id = vrr.id
WHERE LOWER(av.email) = LOWER('cynthia@example.com');
