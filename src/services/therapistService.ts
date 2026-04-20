/**
 * Therapist Management Service
 * Handles invitations, onboarding, and profile management for therapists
 */

import { API_BASE_URL } from '../constants';

export interface TherapistInviteData {
  email: string;
  phone?: string;
}

export interface TherapistInviteResponse {
  success: boolean;
  inviteLink?: string;
  whatsappUrl?: string;
  emailSent?: boolean;
  emailError?: string | null;
}

/**
 * Admin: Send therapist invitation
 */
export const inviteTherapist = async (data: TherapistInviteData): Promise<TherapistInviteResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/invite-therapist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Error inviting therapist:', error);
    return { success: false };
  }
};

/**
 * Get therapist invites (admin list)
 */
export const getTherapistInvites = async (status?: string, limit = 50, offset = 0) => {
  try {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    const response = await fetch(`${API_BASE_URL}/api/admin/therapist-invitations?${params}`);
    if (!response.ok) throw new Error('Failed to fetch invites');
    return await response.json();
  } catch (error) {
    console.error('Error fetching therapist invites:', error);
    throw error;
  }
};

/**
 * Get single invite by token (for acceptance page)
 */
export const getTherapistInvite = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/invite/${token}`);
    if (!response.ok) throw new Error('Invalid or expired invite');
    return await response.json();
  } catch (error) {
    console.error('Error fetching therapist invite:', error);
    throw error;
  }
};

/**
 * Accept invitation and create therapist account
 */
export const acceptTherapistInvite = async (token: string, profileData: {
  password: string;
  name: string;
  specialization: string;
  bio: string;
  languages?: string;
  availability?: string;
  availabilitySchedule?: string;
  sessionPrice?: string;
  termsAccepted: boolean;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/invite/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...profileData })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to accept invite');
    }
    return await response.json();
  } catch (error) {
    console.error('Error accepting therapist invite:', error);
    throw error;
  }
};

/**
 * Get therapist's own profile
 */
export const getTherapistProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/support/therapists/profile/self`, {
      headers: {
        'x-role': 'therapist',
        'x-user-id': '',
        'x-user-email': '',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return await response.json();
  } catch (error) {
    console.error('Error fetching therapist profile:', error);
    throw error;
  }
};

/**
 * Update therapist's own profile
 */
export const updateTherapistProfile = async (profileData: {
  name?: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  qualifications?: string;
  experience?: string;
  languages?: string;
  availability?: string;
  availabilitySchedule?: string;
  sessionPrice?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/support/therapists/profile/self`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating therapist profile:', error);
    throw error;
  }
};
