# Unity Within — Therapist Portal & Patient Booking PRD

Version: v1.0 Draft  
Date: April 2026  
Product: Mental Health Platform  
Scope: User Support, Therapist Portal, Admin Portal, Booking, Realtime Sessions, Notifications

## 1. Overview and Goals

Unity Within connects people seeking emotional support with licensed therapists through a low-friction booking and session experience.

### Primary Goal
Enable users to discover, book, and join therapy sessions (chat, voice, video) quickly and safely.

### Secondary Goal
Give therapists a professional workspace to manage availability, session requests, communication, and notes.

### Admin Goal
Provide full oversight of therapist operations, invitations, and platform-level performance metrics.

---

## 2. User Roles and Personas

### U — Patient/User
- Discover therapists from Support page.
- Filter by specialization, language, price, and availability.
- Book voice/video sessions.
- Pre-chat with therapist before booking.
- Join WebRTC room at session time.
- Leave post-session review.

### T — Therapist
- Access private therapist portal.
- Approve/decline/propose alternatives for session requests.
- Manage weekly schedule and block-off dates.
- Host voice/video sessions.
- Keep private client notes.

### A — Admin
- Manage therapist roster lifecycle (invited, active, suspended).
- Send therapist invites by email, WhatsApp, or share link.
- View platform analytics and session quality indicators.
- Perform oversight and intervention workflows.

---

## 3. Design Language (Use Existing Unity Within Theme)

All new portal views and booking flows must use existing Unity Within design tokens and interaction style.

### Color System (Tailwind theme)
- Primary brand: unity-500 (#f43f5e)
- Primary states: unity-50 to unity-900
- Base text: unity-black (#18181b)
- Soft surfaces: wellness calm/serene/gentle/tranquil/balance

### Typography
- Heading font: Poppins (theme fontFamily.heading)
- Body font: Nunito (theme fontFamily.sans)

### Motion
- Existing animation tokens: breathe, float, pulse-gentle
- Use gentle transitions; avoid abrupt movement in mental-health-critical steps

### Component Style
- Rounded cards and pills (3xl radius)
- Soft gradients (unity + wellness)
- High contrast for CTA and status labels
- Calm spacing and predictable layout rhythm

---

## 4. User Portal — Support Page

The Support page is the discovery surface for therapist matching.

### 4.1 Therapist Directory
- Grid/list toggle.
- Therapist card fields:
  - photo, name, credentials
  - specializations
  - languages
  - offered session types
  - availability indicator
  - next available slot
  - rate
  - rating
- Filters:
  - specialization
  - session type
  - price range
  - availability (today/this week)
  - language
  - gender preference
  - rating
- Search:
  - by therapist name
  - by keyword

### 4.2 Therapist Profile Modal/Page
- Full bio and credentials.
- Optional intro video.
- Calendar preview of available slots.
- Primary actions:
  - Book now
  - Send a message

### 4.3 Pre-Booking Chat
- Real-time thread per user-therapist pair.
- Persist thread history.
- Therapist replies from portal inbox.
- Thread can convert to booking.

---

## 5. Interactive Booking Flow

Multi-step accessible wizard:

1. Session Type  
2. Date and Time  
3. Concerns Intake  
4. Confirm and Pay  
5. Confirmation

### Step 1 — Session Type
- Card toggle: Video vs Voice.
- Show duration and short guidance text.
- Selected card has clear highlight.

### Step 2 — Date and Time
- Inline calendar.
- Available days highlighted.
- Slot pills with status coloring:
  - green available
  - amber limited
  - grey full
- Timezone auto-detect + switch.

### Step 3 — Concerns Intake
- Multi-select concerns list.
- Optional free-text context.
- First-therapy toggle and guidance content.
- Consent checkboxes (data/session consent).

### Step 4 — Confirm and Pay
- Summary card: therapist, type, date/time, duration, price.
- Payment options:
  - card (Stripe)
  - mobile money (M-Pesa / Airtel)
  - voucher code
- Request session CTA (approval-based workflow).

### Step 5 — Confirmed
- Success state with booking reference.
- Calendar add links: Google, Outlook, iCal.
- Status text: Pending therapist approval.
- Link to dashboard.

---

## 6. Therapist Portal

### 6.1 Dashboard
- Metric cards:
  - today sessions
  - pending approvals
  - monthly clients
  - monthly earnings
- Upcoming sessions (next 7 days).
- Quick actions:
  - set availability
  - open messages
  - view bookings
- Recent chat preview.

### 6.2 Session Approval
- Pending queue with client intake context.
- Actions:
  - Approve
  - Decline (reason required)
  - Propose alternate time
- On approve:
  - in-app + Brevo notifications to user
  - move session to confirmed
- Join button activates near session start (time-gated).

### 6.3 Availability Manager
- Weekly recurring slots.
- Date-specific block-offs.
- Buffer settings (15/30 min).
- Daily session cap.

### 6.4 Client Notes
- Therapist-private notes only.
- Session logs by date and type.
- SOAP template support.

### 6.5 Profile and Payout Settings
- Bio, credentials, expertise, language.
- Session types and rate.
- Photo and optional intro video.
- Notification preferences.
- Payout account details.

---

## 7. Admin Portal

### 7.1 Therapist Management
- Master table with status + metrics.
- Read-only therapist portal view mode.
- Suspend/activate therapist.
- Admin override edits.
- CSV export.

### 7.2 Platform Analytics
- Sessions trend chart (D/W/M).
- Completion/cancellation/no-show breakdown.
- Top therapists by volume and rating.
- Revenue and payout status.
- New registrations trend.

### 7.3 Session Oversight
- Global session list with filters.
- Escalation/flag workflow.
- Welfare follow-up marker for crisis-sensitive cases.

---

## 8. Video and Voice Sessions (WebRTC)

### 8.1 Session Room
- P2P WebRTC using STUN/TURN.
- Socket signaling with unique session room key.
- Video mode: split view with pin option.
- Voice mode: audio-only with activity indicator.
- In-session chat persists as transcript.
- Controls:
  - mute
  - camera toggle
  - therapist screen-share
  - end call
- Session timer visible.
- Recording only with dual consent.

### 8.2 Waiting Room
- Join from T-5 minutes.
- Device check before entry.
- Therapist admits participant.
- Late therapist indicator and timer.

### 8.3 Session Gate
- Join disabled until approved + time threshold.
- Join unlock at T-10 minutes.

---

## 9. Notifications and Brevo Email

Event-driven notifications across email + in-app (+ push where needed).

Core triggers include:
- New booking request
- Approve/decline/propose alternate time
- 24h, 1h, 10m reminders
- Session cancellation and completion
- Invite, onboarding, payout and receipt events

Brevo implementation requirements:
- Template IDs managed via environment config.
- Dynamic payload variables:
  - recipient name
  - therapist name
  - date/time
  - booking reference
  - join link
- SMTP fallback for critical transactionals.

---

## 10. Therapist Invite System

### 10.1 Invite Flow
Admin sends invite -> therapist accepts link -> onboarding wizard -> admin verification -> profile goes live.

### 10.2 Invite Channels
- Brevo email invite
- WhatsApp share (wa.me deep link)
- Copy invite link

Rules:
- single-use token
- email-bound token
- expiry + resend + revoke support

### 10.3 Therapist Onboarding Wizard
1. Account Setup  
2. Profile and Credentials  
3. Availability  
4. Payment Info

- Save progress per step.
- Activation only after admin approval.

---

## 11. API Surface (REST)

Base path: /api/v1

### Auth
- POST /auth/login
- POST /auth/register
- POST /auth/invite/accept
- POST /auth/refresh

### Therapists
- GET /therapists
- GET /therapists/:id
- GET /therapists/:id/availability
- PUT /therapists/:id/profile
- PUT /therapists/:id/availability

### Sessions
- POST /sessions
- GET /sessions/:id
- PUT /sessions/:id/approve
- PUT /sessions/:id/decline
- PUT /sessions/:id/cancel
- GET /sessions/:id/room-token

### Chat
- GET /chats/:threadId/messages
- POST /chats/:threadId/messages

### Admin
- POST /admin/invites
- DELETE /admin/invites/:token
- GET /admin/therapists
- PUT /admin/therapists/:id/status
- GET /admin/analytics/overview

---

## 12. Recommended Stack

- Frontend: React + TypeScript + Tailwind
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma ORM (or current platform DB adapter during migration)
- Realtime: Socket.io
- WebRTC signaling: Socket.io
- TURN: Coturn or managed TURN
- Email: Brevo API v3
- Payments: Stripe + M-Pesa Daraja
- Auth: JWT + refresh rotation
- Storage: S3 or R2
- Hosting: Azure / Railway / Render / AWS

---

## 13. Delivery Phases

### Phase 1 (Weeks 1-4)
- Auth
- Therapist profiles
- Support directory
- Basic booking request
- Invite email and admin therapist list

### Phase 2 (Weeks 5-8)
- Full booking wizard
- Approval workflow
- Availability manager
- Notifications
- Payment integration

### Phase 3 (Weeks 9-12)
- Pre-booking chat
- WebRTC session rooms
- Waiting room + device checks
- Session timer and in-session chat

### Phase 4 (Weeks 13-15)
- Admin analytics
- Invite management dashboard
- Therapist monitoring tools
- Payout tracking

### Phase 5 (Weeks 16-18)
- Session notes (SOAP)
- Reviews
- Crisis workflow hardening
- Accessibility + performance polish
- Beta and launch

---

## 14. Non-Functional Requirements

- WCAG 2.1 AA accessibility baseline.
- Encryption in transit and at rest for sensitive data.
- Audit logging for therapist and admin actions.
- Session and message retention policy with consent governance.
- Low-latency interaction targets for chat and session entry.

---

## 15. Success Metrics

- Booking completion rate from Support page.
- Time-to-first-therapist-response.
- Approval turnaround time.
- Session completion rate.
- User CSAT and therapist satisfaction score.
- Reduction in no-show rate after reminders.

---

Confidential - Unity Within Product Draft - April 2026
