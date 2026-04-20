import React from 'react';
import { User, ViewState } from '../types';

interface SignupProps {
  onNavigate: (view: ViewState) => void;
  onLoginSuccess: (user: User) => void;
}

export const Signup: React.FC<SignupProps> = ({ onNavigate, onLoginSuccess }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [emergencyContact, setEmergencyContact] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, emergencyContact })
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      let user = data.user as User;

      // Check if email has a pending/approved volunteer application and activate if needed
      try {
        // Check if user is an approved volunteer
        const checkRes = await fetch(
          `/api/volunteer/check-approved?email=${encodeURIComponent(user.email)}`
        );

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.isApproved) {
            const approved = checkData.approved;
            console.log('✓ User is an approved volunteer');

            // Check if already activated
            if (approved.activatedAt) {
              console.log('✓ Volunteer already activated');
              // Already activated, just set role
              user = {
                ...user,
                role: 'volunteer',
                volunteerStatus: 'active',
                volunteerId: approved.id,
                volunteerRoles: approved.role && [approved.role.display_name] || [],
                volunteerCategory: approved.role?.name || ''
              };
            } else {
              // Not yet activated, try to activate now
              console.log('✓ First-time activation, creating volunteer record...');

              try {
                const activateRes = await fetch(`/api/volunteer/activate/${user.id}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: user.email })
                });

                if (activateRes.ok) {
                  const activateData = await activateRes.json();
                  if (activateData.activated) {
                    console.log('✓ Volunteer activated successfully!');
                    // Set volunteer role and information
                    user = {
                      ...user,
                      role: 'volunteer',
                      volunteerId: activateData.volunteer?.id,
                      volunteerStatus: 'active',
                      volunteerRoles: approved.role && [approved.role.display_name] || [],
                      volunteerCategory: approved.role?.name || ''
                    };
                  } else {
                    // Activation returned false, but user is approved
                    console.log('⚠ Activation returned false, but user is approved - setting role anyway');
                    user = {
                      ...user,
                      role: 'volunteer',
                      volunteerStatus: 'approved',
                      volunteerId: approved.id,
                      volunteerRoles: approved.role && [approved.role.display_name] || [],
                      volunteerCategory: approved.role?.name || ''
                    };
                  }
                } else {
                  // Activation failed but user is still approved
                  console.log('⚠ Activation failed, but user is approved - setting role anyway');
                  user = {
                    ...user,
                    role: 'volunteer',
                    volunteerStatus: 'approved',
                    volunteerId: approved.id,
                    volunteerRoles: approved.role && [approved.role.display_name] || [],
                    volunteerCategory: approved.role?.name || ''
                  };
                }
              } catch (activateError) {
                console.error('Error activating volunteer:', activateError);
                // Still show volunteer portal even if activation fails
                user = {
                  ...user,
                  role: 'volunteer',
                  volunteerStatus: 'approved',
                  volunteerId: approved.id,
                  volunteerRoles: approved.role && [approved.role.display_name] || [],
                  volunteerCategory: approved.role?.name || ''
                };
              }
            }
          }
        }
      } catch (volunteerError) {
        console.error('Error checking volunteer status:', volunteerError);
        // Continue with signup even if volunteer status check fails
      }

      onLoginSuccess(user);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Create an Account</h1>
      
      {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
          <input
            type="text"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 text-white py-2 rounded-lg font-semibold hover:bg-pink-600 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Already have an account?{' '}
        <button
          onClick={() => onNavigate('login')}
          className="text-pink-500 hover:underline font-semibold"
        >
          Log in
        </button>
      </p>
    </div>
  );
};
