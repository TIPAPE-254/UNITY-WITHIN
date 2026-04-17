/**
 * Volunteer Management Service
 * Handles volunteer invitations, tracking, and profile management
 */

import { API_BASE_URL } from '../constants';

export interface VolunteerInviteRequest {
  email: string;
  role: string;
  adminName: string;
  inviteLink: string;
}

export interface VolunteerInviteResponse {
  success: boolean;
  message: string;
  inviteId?: string;
  inviteLink?: string;
}

/**
 * Send volunteer invitation via Brevo email
 */
export const sendVolunteerInvite = async (
  email: string,
  volunteerRole: string,
  adminName: string
): Promise<VolunteerInviteResponse> => {
  try {
    const inviteToken = generateInviteToken();
    const inviteLink = `${window.location.origin}/volunteer-invite/${inviteToken}`;

    const response = await fetch(`${API_BASE_URL}/admin/send-volunteer-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        role: volunteerRole,
        adminName,
        inviteLink,
        inviteToken
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send invitation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending volunteer invite:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send invitation'
    };
  }
};

/**
 * Get volunteer invite by token
 */
export const getVolunteerInvite = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/volunteer/invite/${token}`);
    if (!response.ok) {
      throw new Error('Invalid or expired invite');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching volunteer invite:', error);
    throw error;
  }
};

/**
 * Accept volunteer invitation
 */
export const acceptVolunteerInvite = async (
  token: string,
  userId: string,
  profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    experience: string;
  }
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/volunteer/accept-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        userId,
        ...profileData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to accept invitation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error accepting volunteer invite:', error);
    throw error;
  }
};

/**
 * Get all volunteer invites for admin
 */
export const getVolunteerInvites = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/volunteer-invites`);
    if (!response.ok) {
      throw new Error('Failed to fetch invites');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching volunteer invites:', error);
    throw error;
  }
};

/**
 * Approve volunteer
 */
export const approveVolunteer = async (inviteId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/approve-volunteer/${inviteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to approve volunteer');
    }

    return await response.json();
  } catch (error) {
    console.error('Error approving volunteer:', error);
    throw error;
  }
};

/**
 * Reject volunteer invitation
 */
export const rejectVolunteer = async (inviteId: string, reason: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reject-volunteer/${inviteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error('Failed to reject volunteer');
    }

    return await response.json();
  } catch (error) {
    console.error('Error rejecting volunteer:', error);
    throw error;
  }
};

/**
 * Get volunteer profile
 */
export const getVolunteerProfile = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/volunteer/profile/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching volunteer profile:', error);
    throw error;
  }
};

/**
 * Update volunteer profile
 */
export const updateVolunteerProfile = async (userId: string, data: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/volunteer/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating volunteer profile:', error);
    throw error;
  }
};

/**
 * Generate a unique invite token
 */
export const generateInviteToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Copy invite link to clipboard
 */
export const copyInviteLink = (inviteLink: string): Promise<void> => {
  return navigator.clipboard.writeText(inviteLink);
};

/**
 * Get volunteer statistics for admin dashboard
 */
export const getVolunteerStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/volunteer-stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    throw error;
  }
};
