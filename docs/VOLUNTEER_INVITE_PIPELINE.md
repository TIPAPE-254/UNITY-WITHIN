# 🎯 Volunteer Invite Pipeline - Implementation Guide

## ✅ What's Been Built

### 1. Database Schema (`server/db.js`)
- `volunteer_invites` - Email-based invites with tokens
- `volunteer_applications` - Form submissions from invites
- `approved_volunteers` - Staging table for approved volunteers
- `volunteer_rbac_roles` - Role definitions
- `volunteer_user_permissions` - Permission overrides

### 2. Backend Endpoints (`server/invitePipeline.js` + `server/server.js`)

#### Invite Flow
```
GET  /api/volunteer/invite/:token/verify
     ↓ Opens invite form with prefilled, locked email
POST /api/volunteer/invite/:token/submit
     ↓ Submits application, links to invite
```

#### Admin Approval
```
GET  /api/admin/volunteer-applications
     ↓ List pending applications
POST /api/admin/volunteer-application/:id/approve
     ↓ Approve + assign RBAC role → creates approved_volunteers entry
```

#### Activation on Login/Signup
```
GET  /api/volunteer/check-approved?email={email}
     ↓ Check if approved
POST /api/volunteer/activate/:userId
     ↓ Create volunteer record + assign role
```

### 3. Frontend Components

- `VolunteerApplicationForm.tsx` - Multi-phase form with email prefilling (supports both regular applications and invite submissions)
- `ProtectedVolunteerRoute.tsx` - Route guard for volunteer pages
- `useVolunteerActivation.ts` - Hook to auto-activate on login
- `AdminVolunteers.tsx` - Enhanced admin panel with Applications tab

---

## 🔧 Integration Steps

### Step 1: Add Route for Invite Form

In your main routing file (e.g., `src/App.tsx`):

```tsx
import { VolunteerApplicationForm } from './components/VolunteerApplicationForm';

export function App() {
  return (
    <Routes>
      {/* ... other routes ... */}
      
      {/* Volunteer invite - public, no auth required */}
      <Route 
        path="/volunteer-invite/:token" 
        element={
          <VolunteerApplicationFormWrapper />
        } 
      />
      
      {/* Protected volunteer dashboard */}
      <Route 
        path="/volunteer-dashboard" 
        element={
          <ProtectedVolunteerRoute>
            <VolunteerDashboard />
          </ProtectedVolunteerRoute>
        } 
      />
      
      {/* Other routes... */}
    </Routes>
  );
}
```

**Note:** Create a wrapper component to extract the token and pass it to the form:

```tsx
import { useParams } from 'react-router-dom';
import { VolunteerApplicationForm } from './components/VolunteerApplicationForm';

export function VolunteerApplicationFormWrapper() {
  const { token } = useParams<{ token: string }>();
  
  return (
    <VolunteerApplicationForm 
      inviteToken={token}
    />
  );
}
```

### Step 2: Add Activation Hook to Your Auth Context

In your main auth component (e.g., after login/signup):

```tsx
import { useVolunteerActivation } from './hooks/useVolunteerActivation';

export function AuthProvider() {
  // ... existing auth setup ...
  
  return (
    <AuthContext.Provider value={authValue}>
      <VolunteerActivationWrapper>
        {children}
      </VolunteerActivationWrapper>
    </AuthContext.Provider>
  );
}

function VolunteerActivationWrapper({ children }: { children: React.ReactNode }) {
  useVolunteerActivation();
  return <>{children}</>;
}
```

### Step 3: Admin Creates Invite

Admin uses the "Send Invites" tab in AdminVolunteers:

```
1. Enter email
2. Click "Send Invite"
3. Email sent with link: /volunteer-invite/{token}
```

### Step 4: Volunteer Opens Link

```
Link: https://yourapp.com/volunteer-invite/{token}
     ↓
Form loads with email prefilled (disabled)
Volunteer fills form
Click "Submit Application"
     ↓
Application stored with invite_id
Invite marked as "used"
```

### Step 5: Admin Reviews & Approves

Admin goes to "Applications" tab:

```
1. See pending applications
2. Click application to view details
3. Select RBAC role
4. Click "Approve"
     ↓
- Creates approved_volunteers entry
- Sends approval email to volunteer
- Invite marked as "approved"
```

### Step 6: Volunteer Logs In / Signs Up

```tsx
// This happens automatically via the useVolunteerActivation hook:

1. User logs in/signs up with their email
2. Hook checks if email is in approved_volunteers
3. If yes:
   - Creates volunteers record
   - Assigns RBAC role
   - Updates user.role = 'volunteer'
   - Triggers volunteer-activated event
4. Volunteer dashboard becomes accessible!
```

---

## 🔐 Security Features

### ✅ Email Locking
- Email is prefilled from database
- Frontend disabled (visual)
- **Backend validates** on submission (must match invite email)
- Prevents email swapping attacks

### ✅ Token Verification
- Each invite has unique, expiring token
- Status transitions: pending → used → approved
- Cannot reuse expired/used tokens
- Frontend + backend validation

### ✅ Approval Required
- Application doesn't activate until admin approves
- Approval creates approved_volunteers, not immediate volunteer record
- Volunteer record created only at login/signup
- Admin chooses exact role

### ✅ Role-Based Access
- Volunteer pages protected by ProtectedVolunteerRoute
- Checks user.role === 'volunteer'
- Backend enforces permissions via RBAC

---

## 📊 Database Flow

```
                    STEP 1                  STEP 2                  STEP 3
                 Admin Creates          Volunteer Opens        Volunteer Submits
                   Invite                   Link                  Application

volunteer_invites:
- id: 1
- email: volunteer@example.com
- token: abc123...
- status: "pending"              ──→    "pending"          ──→  "used"
- expires_at: 2025-12-31

                                                                volunteer_applications:
                                                                - id: 1
                                                                - email: volunteer@example.com
                                                                - invite_id: 1
                                                                - status: "pending_admin_review"
                                                                - first_name, skills, etc...

                                              STEP 4
                                          Admin Approves

approved_volunteers:
                                      ──→ - id: 1
                                          - email: volunteer@example.com
                                          - role_id: 2 (Community Listener)
                                          - application_id: 1
                                          - approved_at: NOW()
                                          - activated_at: NULL

                                              STEP 5
                                         User Logs In

volunteers:
                                      ──→ - id: 1
                                          - email: volunteer@example.com
                                          - rbac_role_id: 2
                                          - status: "active"

approved_volunteers.activated_at = NOW()
```

---

## 🎨 Admin UI Flow

```
┌─────────────────────────────────────────┐
│      AdminVolunteers Component          │
├─────────────────────────────────────────┤
│  ┌─ Send Invites      ┌─ Applications   │
│  │   Tab              │   Tab           │
│  │ ┌──────────────┐   │ ┌──────────────┐ │
│  │ │ Invite Form  │   │ │ List Pending │ │
│  │ │ Email        │   │ │ Applications │ │
│  │ │ Send button  │   │ └──────────────┘ │
│  │ └──────────────┘   │ ┌──────────────┐ │
│  │                    │ │ Application  │ │
│  │                    │ │ Details + Approves
│  │                    │ │ Select Role  │ │
│  │                    │ │ Approve Btn  │ │
│  │                    │ └──────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📧 Email Templates

### Invite Email
```
Subject: You're invited to volunteer at UNITY WITHIN
Body: 
  "Click here to join our volunteer community"
  [Link: /volunteer-invite/{token}]
  "Your application will be reviewed by our team"
```

### Approval Email
```
Subject: ✓ Your Volunteer Application is Approved!
Body:
  "Great news! You've been approved as..."
  "Your Role: [Community Listener, etc]"
  "Next: Log in or sign up using {email}"
  "Then access your volunteer dashboard"
```

---

## 🔄 Full User Journey

```
1. [ADMIN] Creates invite link
   ↓ Email sent to volunteer@example.com
2. [VOLUNTEER] Clicks link → /volunteer-invite/{token}
   ↓ Form loads, email locked
3. [VOLUNTEER] Fills form → Submits
   ↓ Application stored, invite marked "used"
4. [ADMIN] Reviews application in AdminVolunteers
   ↓ Selects "Community Listener" role
5. [ADMIN] Clicks "Approve"
   ↓ Approval email sent, volunteer staged in approved_volunteers
6. [VOLUNTEER] Logs in / Signs up
   ↓ Hook detects approved status
7. [SYSTEM] Auto-activates volunteer role
   ↓ Creates volunteers record, sets role
8. [VOLUNTEER] Gains access to volunteer dashboard
   ✅ 🎉 Complete!
```

---

## 🚀 Key Features Summary

| Feature | Implementation | Security |
|---------|---|---|
| Email-Tied Invite | Token + email in DB | Backend validates email match |
| Prefilled Email | Fetch from DB on load | Disabled, cannot edit on form |
| Form Submission | Linked to invite_id | Email must match invite |
| Admin Approval | Creates approved_volunteers | Role selected by admin |
| Auto-Activation | Hook on login/signup | Checks approved_volunteers |
| Route Protection | ProtectedVolunteerRoute | Backend enforces role |
| Role Assignment | RBAC system | Multiple roles supported |

---

## ⚠️ Important Notes

1. **Don't force signup immediately after invite** - Let user open link, fill form, then sign up when ready
2. **Email is the primary identity** - Not the link. Always validate backend
3. **Approval creates staged record** - Volunteer not activated until actual login/signup
4. **Cache invalidation** - Clear permission cache on role changes
5. **Expired invites** - Auto-cleanup or manual via admin panel is optional but recommended

---

## 📝 Testing Checklist

- [ ] Admin creates invite → email sent
- [ ] Volunteer opens link → form loads with locked email
- [ ] Volunteer submits → application created, invite marked "used"
- [ ] Admin approves → approved_volunteers created, email sent
- [ ] Volunteer tries to reuse invite → "already used" error
- [ ] Volunteer tries to change email → rejected at submission
- [ ] User logs in after approval → auto-activated
- [ ] Volunteer dashboard loads → protected route allows access
- [ ] User without approval → protected route denies access

---

Done! Your volunteer invite pipeline is complete and secure. 🎉
