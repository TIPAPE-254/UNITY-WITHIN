# Auto-Activate Existing Approved Volunteers

## Overview

Existing approved volunteers (like Cynthia) can now automatically see the volunteer portal when they log in, without going through the invite pipeline.

---

## How It Works

### Login Flow for Approved Volunteers

```
Existing Approved Volunteer Logs In
    ↓
GET /api/volunteer/check-approved?email=cynthia@example.com
    ↓
Search for email in approved_volunteers table
    ↓
If found and activated_at IS NOT NULL:
    → Set user.role = 'volunteer' (no activation needed)
    → Route to volunteer-portal
    
If found and activated_at IS NULL:
    → Call POST /api/volunteer/activate/{userId}
    → Set activated_at = NOW()
    → Set user.role = 'volunteer'
    → Route to volunteer-portal

If not found:
    → Route to regular dashboard
```

---

## How to Register Existing Approved Volunteers

### Option 1: SQL Script (Recommended)

1. **Open your database client** (pgAdmin, DBeaver, etc.)

2. **Run the SQL migration script:**
   ```bash
   # Or use your preferred database tool
   psql -U $POSTGRES_USER -d $POSTGRES_DB -f server/migrate_approved_volunteers.sql
   ```

3. **Update the email, name, and role:**
   ```sql
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
     'cynthia@example.com',
     'Cynthia',
     'Williams',
     1,  -- Community Listener (check volunteer_rbac_roles.id)
     'admin',
     NOW(),
     NOW(),  -- Mark as already activated
     'Existing approved volunteer'
   )
   ON CONFLICT (email) DO UPDATE SET
     activated_at = COALESCE(approved_volunteers.activated_at, NOW());
   ```

4. **Verify she's registered:**
   ```sql
   SELECT * FROM approved_volunteers 
   WHERE LOWER(email) = LOWER('cynthia@example.com');
   ```

### Option 2: Node.js Migration Script

1. **Run the migration script:**
   ```bash
   cd server
   node migrate_approved_volunteers.js
   ```

2. **The script will:**
   - Find all existing volunteer records
   - Add them to approved_volunteers table
   - Show you what was migrated
   - Display a list of all approved volunteers

### Option 3: API Endpoint (For Admin Dashboard)

If we add an admin endpoint later:
```
POST /api/admin/register-approved-volunteer
{
  "email": "cynthia@example.com",
  "firstName": "Cynthia",
  "lastName": "Williams",
  "rbacRoleId": 1
}
```

---

## Test That It Works

### 1. Verify Database Entry
```sql
SELECT email, first_name, last_name, role_id, activated_at
FROM approved_volunteers 
WHERE LOWER(email) = LOWER('cynthia@example.com');
```

Expected output:
```
         email         | first_name | last_name | role_id | activated_at
-----------------------+------------+-----------+---------+---------------------
 cynthia@example.com   | Cynthia    | Williams  |       1 | 2026-04-20 ...
```

### 2. Test Login Flow
1. Open the app
2. Go to Login page
3. Enter Cynthia's credentials
4. After login, check browser console for logs:
   ```
   ✓ User is an approved volunteer
   ✓ Volunteer already activated
   ```
5. Should automatically route to `volunteer-portal`
6. Should see volunteer dashboard with assigned role

### 3. Browser Debug
Open DevTools Console and check for messages:
```javascript
// Should appear after login
console.log('✓ User is an approved volunteer')
console.log('✓ Volunteer already activated')
```

---

## Volunteer Roles (RBAC Role IDs)

Query to see available roles:
```sql
SELECT id, name, display_name, description 
FROM volunteer_rbac_roles 
ORDER BY id;
```

Common roles:
| ID | Name | Display Name |
|----|------|--------------|
| 1 | listener | Community Listener |
| 2 | advocate | Mental Health Advocate |
| 3 | ambassador | Outreach Ambassador |
| 4 | content | Content & Story Volunteer |
| 5 | wellness | Wellness Program Support |
| 6 | tech | Tech Support Volunteer |

---

## Updated User Data Schema

When Cynthia logs in, her user object will look like:

```typescript
{
  id: "user-id",
  firstName: "Cynthia",
  lastName: "Williams",
  email: "cynthia@example.com",
  role: "volunteer",  // ← This determines routing
  volunteerStatus: "active",
  volunteerId: "vol-123",
  volunteerRoles: ["Community Listener"],
  volunteerCategory: "listener"
}
```

Key fields for routing:
- `role === 'volunteer'` → Routes to volunteer-portal ✓
- `volunteerStatus === 'approved'` or `'active'` → Routes to volunteer-portal ✓

---

## What Happens on Page Reload

1. User logged in as volunteer
2. Closes browser
3. Opens app again
4. App checks localStorage for saved user
5. Finds `user.role === 'volunteer'`
6. Routes directly to `volunteer-portal` (no need to check database again)
7. No login needed - already authenticated

---

## If Auto-Activation Still Fails

The system is designed to be **non-blocking**:

1. Even if `/api/volunteer/activate` fails
2. If user is in `approved_volunteers` table and marked approved
3. System still sets `user.role = 'volunteer'`
4. Volunteer portal still shows
5. Logs show the error for debugging

Check server logs for:
```
Error activating volunteer: [error message]
```

---

## Flow Diagram: Existing Approved Volunteers

```
Cynthia's First Login with New System
        ↓
POST /api/login (email/password)
        ↓
Check /api/volunteer/check-approved?email=cynthia@...
        ↓
SELECT FROM approved_volunteers WHERE email = 'cynthia@...'
        ↓
Found in approved_volunteers + activated_at is NOT NULL
        ↓
Set user.role = 'volunteer' (no activation call needed)
        ↓
handleLoginSuccess(user)
        ↓
App.tsx checks: user.role === 'volunteer' ✓
        ↓
Route to 'volunteer-portal'
        ↓
VolunteerPortal component loads
        ↓
Cynthia sees her volunteer dashboard!
```

---

## Summary: Steps to Activate Cynthia

1. **Get her email** - e.g., `cynthia@example.com`
2. **Get her role ID** - Query volunteer_rbac_roles (typically 1 = Community Listener)
3. **Run SQL insert:**
   ```sql
   INSERT INTO approved_volunteers (email, first_name, last_name, role_id, approved_by, approved_at, activated_at)
   VALUES ('cynthia@example.com', 'Cynthia', 'Williams', 1, 'admin', NOW(), NOW());
   ```
4. **Test login** - Cynthia logs in, should see volunteer portal
5. **Done!** 🎉

---

## Related Files

- `server/invitePipeline.js` - Backend auto-activation logic
- `src/components/Login.tsx` - Login approval check
- `src/components/Signup.tsx` - Signup approval check
- `src/App.tsx` - Volunteer portal routing
- `docs/AUTO_VOLUNTEER_ACTIVATION.md` - Detailed activation docs
- `server/migrate_approved_volunteers.js` - Node.js migration tool
- `server/migrate_approved_volunteers.sql` - SQL migration script

---

**Status:** ✅ Ready to activate existing volunteers like Cynthia!
