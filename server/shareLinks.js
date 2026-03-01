const crypto = require("crypto");
const pool = require("./db").pool;

// Create a community and return a shareable link
async function createCommunityLink(name) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const [result] = await pool.query(
    "INSERT INTO communities (name, slug) VALUES (?, ?) RETURNING *",
    [name, slug]
  );
  return `https://unitywithin.app/community/${slug}`;
}

// Create a buddy invite and return a shareable link
async function createBuddyLink(inviterId) {
  const inviteCode = crypto.randomBytes(6).toString("hex");
  await pool.query(
    "INSERT INTO buddy_invites (inviter_id, invite_code) VALUES (?, ?)",
    [inviterId, inviteCode]
  );
  return `https://unitywithin.app/buddy/${inviteCode}`;
}

module.exports = {
  createCommunityLink,
  createBuddyLink
};
