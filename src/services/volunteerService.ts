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
    console.log('Send invite response:', { status: response.status, payload });
    
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
          ? 'Invite created! Email not sent - copy link below to share manually'
          : 'Invitation sent successfully'),
      success: true
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
export const copyInviteLink = async (inviteLink: string): Promise<boolean> => {
  if (!inviteLink) {
    throw new Error('No invite link to copy');
  }
  
  try {
    // Try using the modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(inviteLink);
      return true;
    } else {
      // Fallback for older browsers or insecure contexts
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('Copy command was unsuccessful');
      }
      return true;
    }
  } catch (error) {
    console.error('Copy to clipboard error:', error);
    throw error;
  }
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

/**
 * Delete invite (admin) - removes pending invite before volunteer responds
 */
export const deleteInvite = async (inviteId: string | number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/invite/${inviteId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete invite');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting invite:', error);
    throw error;
  }
};

/**
 * Approve invite submission (admin) - volunteer filled form, admin approves
 */
export const approveInviteSubmission = async (inviteId: string | number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/invite/${inviteId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error('Failed to approve invite');
    }
    return await response.json();
  } catch (error) {
    console.error('Error approving invite:', error);
    throw error;
  }
};

/**
 * Reject invite submission (admin) - volunteer filled form, admin rejects
 */
export const rejectInviteSubmission = async (inviteId: string | number, reason?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/invite/${inviteId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) {
      throw new Error('Failed to reject invite');
    }
    return await response.json();
  } catch (error) {
    console.error('Error rejecting invite:', error);
    throw error;
  }
};

// ========== PEER SUPPORT LISTENER ENDPOINTS ==========

/**
 * Get available peer support listeners (for clients)
 */
export const getAvailableListeners = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/peer-support/listeners`);
    if (!response.ok) {
      throw new Error('Failed to fetch available listeners');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching listeners:', error);
    throw error;
  }
};

/**
 * Request peer support call from client
 */
export const requestPeerSupportCall = async (
  clientEmail: string,
  callType: 'voice' | 'video'
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/peer-support/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientEmail,
        callType
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to request peer support call');
    }

    return await response.json();
  } catch (error) {
    console.error('Error requesting peer support call:', error);
    throw error;
  }
};

/**
 * Get peer support call status
 */
export const getPeerSupportCallStatus = async (callId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/peer-support/call/${callId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch call status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching call status:', error);
    throw error;
  }
};

/**
 * Update peer support call status (for volunteers)
 */
export const updatePeerSupportCallStatus = async (
  callId: string,
  status: 'pending' | 'active' | 'ended',
  email: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/peer-support/call/${callId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update call status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating call status:', error);
    throw error;
  }
};

/**
 * Get listener queue (for community listener volunteers)
 */
export const getListenerQueue = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/peer-support/listener-queue`, {
      headers: {
        'x-user-email': email
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch listener queue');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching listener queue:', error);
    throw error;
  }
};

/**
 * Toggle listener availability status
 */
export const toggleListenerAvailability = async (
  email: string,
  isAvailable: boolean
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/peer-support/listener-availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email
      },
      body: JSON.stringify({ isAvailable })
    });

    if (!response.ok) {
      throw new Error('Failed to update availability status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating availability status:', error);
    throw error;
  }
};
