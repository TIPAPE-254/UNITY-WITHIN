import { useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook to activate volunteer role when user logs in/signs up
 * 
 * Flow:
 * 1. User logs in/signs up
 * 2. Check if they are an approved volunteer
 * 3. If yes, activate them (create volunteer record + assign role)
 * 4. Set role to 'volunteer'
 */
export const useVolunteerActivation = () => {
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const activateIfApproved = async () => {
      // Only activate if logged in but not already a volunteer
      if (!user?.id || !user?.email || user?.role === 'volunteer') {
        return;
      }

      try {
        // Check if this user is an approved volunteer
        const checkRes = await fetch(
          `/api/volunteer/check-approved?email=${encodeURIComponent(user.email)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!checkRes.ok) {
          console.log('Not an approved volunteer');
          return;
        }

        const checkData = await checkRes.json();

        if (!checkData.isApproved) {
          console.log('User is not an approved volunteer');
          return;
        }

        console.log('✓ User is approved! Activating volunteer role...');

        // Activate volunteer
        const activateRes = await fetch(`/api/volunteer/activate/${user.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!activateRes.ok) {
          console.error('Failed to activate volunteer');
          return;
        }

        const activateData = await activateRes.json();

        if (activateData.activated) {
          console.log('✓ Volunteer activated successfully!');

          // Update user context with volunteer role
          updateUser({
            ...user,
            role: 'volunteer',
            volunteerId: activateData.volunteer?.id
          });

          // Show success message
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('volunteer-activated', {
              detail: {
                volunteerId: activateData.volunteer?.id,
                role: checkData.approved?.role
              }
            });
            window.dispatchEvent(event);
          }
        }
      } catch (error) {
        console.error('Error checking/activating volunteer:', error);
        // Don't block login if this fails
      }
    };

    activateIfApproved();
  }, [user?.id, user?.email, user?.role, updateUser]);
};

export default useVolunteerActivation;
