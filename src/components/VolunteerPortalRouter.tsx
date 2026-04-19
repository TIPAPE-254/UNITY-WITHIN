/**
 * Volunteer Portal Router
 * Routes volunteers to the appropriate portal based on their role/category
 */

import React, { useState, useEffect } from 'react';
import { getVolunteerDashboardData } from '../services/volunteerService';
import { CommunityListenerPortal } from './CommunityListenerPortal';
import { CreativeVolunteerPortal } from './CreativeVolunteerPortal';
import { TechVolunteerPortal } from './TechVolunteerPortal';
import { OutreachVolunteerPortal } from './OutreachVolunteerPortal';
import { AdminVolunteerPortal } from './AdminVolunteerPortal';

interface VolunteerPortalRouterProps {
  userEmail?: string;
  userName?: string;
}

interface DashboardData {
  id: number;
  first_name: string;
  email: string;
  role_title: string;
  category?: string;
  matched_role_id?: number;
}

/**
 * Determine the category from the role title
 */
const getCategoryFromRole = (roleTitle: string = ''): string => {
  const role = roleTitle.toLowerCase();
  
  // Support & Community
  if (
    role.includes('community listener') ||
    role.includes('peer support') ||
    role.includes('mental health')
  ) {
    return 'community-listener';
  }

  // Creative
  if (
    role.includes('artist') ||
    role.includes('musician') ||
    role.includes('writer') ||
    role.includes('designer') ||
    role.includes('content creator')
  ) {
    return 'creative';
  }

  // Tech
  if (
    role.includes('developer') ||
    role.includes('engineer') ||
    role.includes('tester') ||
    role.includes('qr') ||
    role.includes('qa') ||
    role.includes('tech') ||
    role.includes('coordinator')
  ) {
    return 'tech';
  }

  // Outreach
  if (
    role.includes('outreach') ||
    role.includes('partnership') ||
    role.includes('marketing') ||
    role.includes('social media')
  ) {
    return 'outreach';
  }

  // Admin
  if (
    role.includes('admin') ||
    role.includes('manager') ||
    role.includes('coordinator') ||
    role.includes('supervisor')
  ) {
    return 'admin';
  }

  return 'general';
};

export const VolunteerPortalRouter: React.FC<VolunteerPortalRouterProps> = ({
  userEmail = '',
  userName = 'Volunteer'
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('general');

  useEffect(() => {
    if (userEmail) {
      loadDashboardData();
    }
  }, [userEmail]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await getVolunteerDashboardData(userEmail);
      setDashboardData(data);
      
      // Determine category from role
      const detectedCategory = getCategoryFromRole(data.role_title);
      setCategory(detectedCategory);
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load volunteer profile');
      setIsLoading(false);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md border border-purple-200 text-center">
          <p className="text-2xl mb-4">🔐</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your volunteer portal.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your volunteer portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-red-50 rounded-2xl shadow-lg p-8 max-w-md border border-red-200">
          <p className="text-2xl mb-4">⚠️</p>
          <h2 className="text-2xl font-bold text-red-800 mb-4">Error Loading Portal</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Route to appropriate portal based on category
  switch (category) {
    case 'community-listener':
      return (
        <CommunityListenerPortal
          userEmail={userEmail}
          userName={dashboardData?.first_name || userName}
        />
      );

    case 'creative':
      return (
        <CreativeVolunteerPortal
          userEmail={userEmail}
          userName={dashboardData?.first_name || userName}
        />
      );

    case 'tech':
      return (
        <TechVolunteerPortal
          userEmail={userEmail}
          userName={dashboardData?.first_name || userName}
        />
      );

    case 'outreach':
      return (
        <OutreachVolunteerPortal
          userEmail={userEmail}
          userName={dashboardData?.first_name || userName}
        />
      );

    case 'admin':
      return (
        <AdminVolunteerPortal
          userEmail={userEmail}
          userName={dashboardData?.first_name || userName}
        />
      );

    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-purple-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🎉 Welcome, {dashboardData?.first_name}!</h1>
            <p className="text-gray-600 mb-6 text-lg">
              You're registered as: <span className="font-bold text-purple-600">{dashboardData?.role_title}</span>
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <p className="text-amber-900 font-semibold mb-2">📋 Role Not Yet Configured</p>
              <p className="text-amber-800 text-sm">
                Your volunteer role hasn't been mapped to a specific portal yet. Please contact an administrator to set up your volunteer portal access.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-900 font-semibold mb-2">📞 Need Help?</p>
              <p className="text-blue-800 text-sm">
                Contact the admin team if you need assistance accessing your volunteer resources.
              </p>
            </div>
          </div>
        </div>
      );
  }
};

export default VolunteerPortalRouter;
