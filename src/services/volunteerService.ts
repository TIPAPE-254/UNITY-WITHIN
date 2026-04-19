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
  emailSent?: boolean;
  emailError?: string;
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
    const response = await fetch(`${API_BASE_URL}/api/admin/invite-volunteer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        role: volunteerRole,
        adminName
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: payload?.error || 'Failed to send invitation',
        inviteId: payload?.inviteId,
        inviteLink: payload?.inviteLink,
      };
    }

    return {
      ...payload,
      message:
        payload?.message ||
        (payload?.emailSent === false
          ? 'Invite created but email was not sent'
          : 'Invitation sent'),
    };
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
    const response = await fetch(`${API_BASE_URL}/api/volunteer/invite/${token}`);
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
    matchedRoleId: number;
  }
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        userId,
        name: `${profileData.firstName} ${profileData.lastName || ''}`.trim(),
        county: profileData.location,
        matched_role_id: profileData.matchedRoleId,
        skills: profileData.experience ? [profileData.experience] : [],
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
 * Get volunteer categories/roles for invitee self-selection
 */
export const getVolunteerRoles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/roles`);
    if (!response.ok) {
      throw new Error('Failed to fetch volunteer roles');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching volunteer roles:', error);
    throw error;
  }
};

/**
 * Get all volunteer invites for admin
 */
export const getVolunteerInvites = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/volunteer-invites`);
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
    const response = await fetch(`${API_BASE_URL}/api/admin/approve-volunteer/${inviteId}`, {
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
    const response = await fetch(`${API_BASE_URL}/api/admin/reject-volunteer/${inviteId}`, {
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
    const response = await fetch(`${API_BASE_URL}/api/volunteer/profile/${userId}`);
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
 * Get volunteer dashboard data
 */
export const getVolunteerDashboardData = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/dashboard`, {
      headers: {
        'x-user-email': email,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch volunteer dashboard');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching volunteer dashboard:', error);
    throw error;
  }
};

/**
 * Update volunteer profile
 */
export const updateVolunteerProfile = async (userId: string, data: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/profile/${userId}`, {
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
    const response = await fetch(`${API_BASE_URL}/api/admin/volunteer-stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    throw error;
  }
};

/**
 * Get volunteers for admin tracking
 */
export const getAdminVolunteers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/volunteers`);
    if (!response.ok) {
      throw new Error('Failed to fetch volunteers');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching admin volunteers:', error);
    throw error;
  }
};

/**
 * Get volunteer activity summary (hours + tasks)
 */
export const getVolunteerActivity = async (volunteerId: string | number) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/volunteer-activity?volunteerId=${encodeURIComponent(String(volunteerId))}`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch volunteer activity');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching volunteer activity:', error);
    throw error;
  }
};

/**
 * Delete volunteer (admin)
 */
export const deleteVolunteer = async (volunteerId: string | number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/volunteer/${volunteerId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete volunteer');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    throw error;
  }
};
