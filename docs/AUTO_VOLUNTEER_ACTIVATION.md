# Auto-Activation of Approved Volunteers

## Overview

Approved volunteers now automatically see the volunteer portal when they log in or sign up with their approved email address. The system performs the following:

1. **Check Approval Status** - Verifies if the user's email is in the `approved_volunteers` table
2. **Auto-Activate** - If approved, creates a `volunteers` record with the RBAC role assignment
3. **Set Role** - Updates user's role to `'volunteer'` 
4. **Route to Portal** - Automatically shows the volunteer portal instead of the regular dashboard

## Flow Diagram

```
User Login/Signup
        ↓
   [Email Check]
        ↓
Is Email Approved?
   ↙ (Yes)  ↘ (No)
Auto-Activate  Regular Dashboard
   ↓
Set role: 'volunteer'
   ↓
Route to Volunteer Portal
```

## Implementation Details

### 1. Login Component (`src/components/Login.tsx`)

After successful login:
```tsx
1. Call /api/volunteer/check-approved?email={email}
2. If isApproved = true:
   - Call POST /api/volunteer/activate/{userId}
   - Set user.role = 'volunteer'
   - Set user.volunteerStatus = 'active'
3. Return user to App via onLoginSuccess()
```

### 2. Signup Component (`src/components/Signup.tsx`)

After successful signup:
```tx
1. Same logic as Login
2. New user automatically activated if their email was pre-approved
```

### 3. App.tsx Routing

**Initial View Logic:**
- If user not logged in → 'landing'
- If user.role === 'volunteer' OR volunteerStatus === 'approved' → 'volunteer-portal'
- Otherwise → 'dashboard'

**On Login Success:**
- Check user.role === 'volunteer' status
- Route to 'volunteer-portal' if volunteer
- Route to 'dashboard' if regular user

### 4. Page Reload Handling

When a volunteer browser the app with a saved session:
1. User object loaded from localStorage
2. App checks user.role on mount
3. If volunteer, automatically displays volunteer-portal
4. No need to re-authenticate

## User Types

Updated `src/types.ts`:
```tsx
export interface User {
  // ... existing fields ...
  role?: 'user' | 'therapist' | 'admin' | 'volunteer'; // Added 'volunteer'
  volunteerStatus?: VolunteerStatus; // 'active', 'approved', 'inactive', etc.
  volunteerId?: string; // Linked to volunteers table
  volunteerRoles?: string[]; // Array of role titles
  volunteerCategory?: string; // CreativeCategory, 'Tech', etc.
  applicationId?: string; // References volunteer_applications
}

export type VolunteerStatus = 'pending' | 'approved' | 'active' | 'inactive' | 'rejected';
```

## Approved Volunteers Table

The system checks the `approved_volunteers` table:
```sql
SELECT * FROM approved_volunteers 
WHERE email = user_email 
AND activated_at IS NOT NULL
```

If found:
- Volunteer record is created with assigned RBAC role
- User role is set to 'volunteer'
- Access to all volunteer portal features is granted

## Error Handling

If auto-activation fails:
- User still logs in successfully
- System logs error to console
- User still sees volunteer portal if `volunteerStatus === 'approved'`
- Activation can be retried on next login

## VolunteerPortal Features

Once routed to 'volunteer-portal', users see:
- Volunteer dashboard with assigned role
- Task/project management
- Communication tools
- Portal routed based on volunteer category (Creative, Tech, Outreach, etc.)

## Testing Checklist

- [ ] Create invite → send email
- [ ] Volunteer fills form with locked email
- [ ] Admin approves → creates approved_volunteers record
- [ ] Volunteer signs up with approved email
- [ ] After signup, automatically routed to volunteer portal
- [ ] Volunteer logs in next day
- [ ] Still sees volunteer portal (role persisted)
- [ ] Volunteer page shows assigned role and tasks
- [ ] Logout works, login as regular user shows dashboard

## Related Files

- `src/components/Login.tsx` - Auto-activation on login
- `src/components/Signup.tsx` - Auto-activation on signup  
- `src/App.tsx` - Routing based on volunteer status
- `src/types.ts` - User interface with volunteer fields
- `src/components/VolunteerPortal.tsx` - Volunteer landing page
- `server/db.js` - approved_volunteers table schema
- `server/invitePipeline.js` - Approval endpoint that creates approved_volunteers record

## Notes

- Auto-activation is **non-blocking** - if it fails, login still succeeds
- Users must have signed up/registered an account before auto-activation works
- The approved_volunteers table is populated by admin approval in the invite pipeline
- Role assignment comes from the volunteer_rbac_roles linked in approved_volunteers
