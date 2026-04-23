#!/usr/bin/env node

/**
 * Volunteer pipeline smoke test for deployed environments.
 *
 * Verifies end-to-end flow:
 * 1) Admin invite creation
 * 2) Invite verification
 * 3) Invite application submit
 * 4) Admin approval
 * 5) Volunteer portal visibility check
 *
 * Usage:
 *   BASE_URL="https://your-deployment" ADMIN_EMAIL="lepiromatayo@gmail.com" node scripts/volunteer-pipeline-smoke.mjs
 */

function parseArgs(argv) {
  const parsed = {
    baseUrl: '',
    adminEmail: '',
    testEmail: '',
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i] || '');
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg.startsWith('--base-url=')) {
      parsed.baseUrl = arg.slice('--base-url='.length);
      continue;
    }
    if (arg === '--base-url') {
      parsed.baseUrl = String(argv[i + 1] || '');
      i += 1;
      continue;
    }

    if (arg.startsWith('--admin-email=')) {
      parsed.adminEmail = arg.slice('--admin-email='.length);
      continue;
    }
    if (arg === '--admin-email') {
      parsed.adminEmail = String(argv[i + 1] || '');
      i += 1;
      continue;
    }

    if (arg.startsWith('--test-email=')) {
      parsed.testEmail = arg.slice('--test-email='.length);
      continue;
    }
    if (arg === '--test-email') {
      parsed.testEmail = String(argv[i + 1] || '');
      i += 1;
      continue;
    }
  }

  return parsed;
}

function printHelp() {
  console.log('Volunteer pipeline smoke test');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/volunteer-pipeline-smoke.mjs --base-url https://your-app.example.com [--admin-email lepiromatayo@gmail.com] [--test-email smoke@example.com]');
  console.log('');
  console.log('Environment variable alternatives:');
  console.log('  BASE_URL, APP_URL, ADMIN_EMAIL, TEST_VOLUNTEER_EMAIL');
  console.log('');
  console.log('Examples:');
  console.log('  BASE_URL=https://your-app.example.com ADMIN_EMAIL=lepiromatayo@gmail.com node scripts/volunteer-pipeline-smoke.mjs');
  console.log('  node scripts/volunteer-pipeline-smoke.mjs --base-url https://your-app.example.com --admin-email lepiromatayo@gmail.com');
}

const cli = parseArgs(process.argv.slice(2));
if (cli.help) {
  printHelp();
  process.exit(0);
}

const BASE_URL = (cli.baseUrl || process.env.BASE_URL || process.env.APP_URL || '').replace(/\/$/, '');
const ADMIN_EMAIL = (cli.adminEmail || process.env.ADMIN_EMAIL || 'lepiromatayo@gmail.com').trim().toLowerCase();
const TEST_EMAIL = (cli.testEmail || process.env.TEST_VOLUNTEER_EMAIL || `smoke.${Date.now()}@unitywithin.test`).trim().toLowerCase();

if (!BASE_URL) {
  console.error('FAIL: BASE_URL is required, e.g. --base-url https://app.example.com');
  console.error('Tip: run with --help for usage.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'x-user-email': ADMIN_EMAIL,
};

const results = [];

function record(step, ok, detail) {
  results.push({ step, ok, detail });
  const prefix = ok ? 'PASS' : 'FAIL';
  console.log(`${prefix}: ${step}${detail ? ` -> ${detail}` : ''}`);
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  return { response, body };
}

function extractToken(inviteLink) {
  if (!inviteLink) return null;
  const match = inviteLink.match(/\/volunteer-invite\/([^/?#]+)/i);
  return match?.[1] || null;
}

async function run() {
  console.log(`Running volunteer pipeline smoke test against ${BASE_URL}`);
  console.log(`Admin: ${ADMIN_EMAIL}`);
  console.log(`Volunteer test email: ${TEST_EMAIL}`);

  let token = null;
  let applicationId = null;

  // 1) Invite create (or reuse active invite)
  {
    const { response, body } = await requestJson('/api/admin/invite-volunteer', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: TEST_EMAIL, adminName: 'Smoke Test' }),
    });

    if (response.ok && body?.success) {
      token = extractToken(body?.inviteLink);
      record('Invite creation', Boolean(token), token ? `token ${token.slice(0, 8)}...` : 'missing token in inviteLink');
    } else if (response.status === 409 && body?.inviteLink) {
      token = extractToken(body.inviteLink);
      record('Invite creation (reused active)', Boolean(token), body?.error || 'Active invite reused');
    } else {
      record('Invite creation', false, body?.error || `HTTP ${response.status}`);
      process.exitCode = 1;
      return;
    }
  }

  // 2) Verify invite token
  {
    const { response, body } = await requestJson(`/api/volunteer/invite/${encodeURIComponent(token)}/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const ok = response.ok && body?.success && String(body?.invite?.email || '').toLowerCase() === TEST_EMAIL;
    record('Invite verification', ok, ok ? 'email matches' : (body?.error || `HTTP ${response.status}`));
    if (!ok) {
      process.exitCode = 1;
      return;
    }
  }

  // 3) Submit invited application
  {
    const submitPayload = {
      firstName: 'Smoke',
      lastName: 'Volunteer',
      email: TEST_EMAIL,
      phone: '+254700000001',
      location: 'Nairobi',
      availability: '6-10',
      category: 'Community',
      skills: ['listening', 'support'],
      whyVolunteer: 'Automated smoke test for volunteer pipeline',
      mentalHealthContext: 'peer_support',
      workPreference: 'remote',
      notes: 'generated by smoke test',
    };

    const { response, body } = await requestJson(`/api/volunteer/invite/${encodeURIComponent(token)}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitPayload),
    });

    // If invite was already used in a previous run, continue by locating existing application.
    if (response.ok && body?.success) {
      applicationId = Number(body?.application?.id || 0) || null;
      record('Application submit', Boolean(applicationId), applicationId ? `application ${applicationId}` : 'missing application id');
    } else {
      const alreadyUsed = response.status === 410 && String(body?.error || '').toLowerCase().includes('status is "used"');
      record('Application submit', alreadyUsed, alreadyUsed ? 'invite already used; will locate existing application' : (body?.error || `HTTP ${response.status}`));
      if (!alreadyUsed) {
        process.exitCode = 1;
        return;
      }
    }
  }

  // 4) Find latest application id for test email if needed
  if (!applicationId) {
    const { response, body } = await requestJson('/api/admin/volunteer-applications', {
      method: 'GET',
      headers,
    });

    if (!response.ok || !body?.success || !Array.isArray(body?.data)) {
      record('Locate application', false, body?.error || `HTTP ${response.status}`);
      process.exitCode = 1;
      return;
    }

    const latest = body.data
      .filter((row) => String(row.email || '').toLowerCase() === TEST_EMAIL)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    applicationId = latest?.id ? Number(latest.id) : null;
    record('Locate application', Boolean(applicationId), applicationId ? `application ${applicationId}` : 'not found');
    if (!applicationId) {
      process.exitCode = 1;
      return;
    }
  }

  // 5) Approve application via admin endpoint
  {
    const { response, body } = await requestJson(`/api/admin/volunteer-applications/${applicationId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'approved' }),
    });

    const ok = response.ok && body?.success;
    record('Application approval', ok, ok ? `application ${applicationId} approved` : (body?.error || `HTTP ${response.status}`));
    if (!ok) {
      process.exitCode = 1;
      return;
    }
  }

  // 6) Verify volunteer portal visibility by dashboard profile status
  {
    const { response, body } = await requestJson('/api/volunteer/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': TEST_EMAIL,
      },
    });

    const profileStatus = String(body?.data?.profile?.status || '').toLowerCase();
    const ok = response.ok && body?.success && (profileStatus === 'active' || profileStatus === 'approved');
    record('Portal visibility check', ok, ok ? `profile status ${profileStatus}` : (body?.error || `HTTP ${response.status}`));
    if (!ok) {
      process.exitCode = 1;
      return;
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log('\nSmoke test summary:');
  console.log(`Total steps: ${results.length}`);
  console.log(`Passed: ${results.length - failed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Test volunteer email: ${TEST_EMAIL}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('FAIL: Unhandled error in smoke test:', error?.message || error);
  process.exit(1);
});
