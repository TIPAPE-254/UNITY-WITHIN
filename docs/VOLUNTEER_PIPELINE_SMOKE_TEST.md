# Volunteer Pipeline Smoke Test

Use this to verify the full volunteer runtime pipeline in deployment:

1. Admin can create invite
2. Invite token verifies
3. Invited volunteer application submits
4. Admin approval succeeds
5. Volunteer portal visibility becomes available

## Run from repo root

```bash
BASE_URL="https://your-deployment-domain" ADMIN_EMAIL="lepiromatayo@gmail.com" npm run smoke:volunteer-pipeline
```

## Run with CLI arguments

```bash
cd server
node scripts/volunteer-pipeline-smoke.mjs --base-url https://your-deployment-domain --admin-email lepiromatayo@gmail.com
```

## Optional fixed test email

```bash
BASE_URL="https://your-deployment-domain" \
ADMIN_EMAIL="lepiromatayo@gmail.com" \
TEST_VOLUNTEER_EMAIL="smoke.pipeline@yourdomain.com" \
npm run smoke:volunteer-pipeline
```

## Script help

```bash
cd server
node scripts/volunteer-pipeline-smoke.mjs --help
```

## PASS/FAIL behavior

- Script prints PASS/FAIL per step.
- Exits with code 0 only when all steps pass.
- Exits with code 1 when any pipeline step fails.

## Common failure causes

- `403 Admin access required`: `ADMIN_EMAIL` mismatch with deployed backend config.
- `Invalid invite token` or `status is "used"`: old token already consumed by previous run.
- `volunteer dashboard` not approved/active: approval update failed or wrong email was approved.
- Network errors: wrong `BASE_URL` or deployment not reachable.
