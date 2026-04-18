export type ViewState = 'landing' | 'login' | 'signup' | 'dashboard' | 'wellness' | 'chat' | 'journal' | 'breathe' | 'education' | 'admin' | 'explore' | 'resources' | 'profile' | 'volunteer' | 'volunteer-dashboard' | 'volunteer-portal' | 'admin-volunteers';

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role?: 'user' | 'therapist' | 'admin';
  authProvider?: 'email' | 'clerk';
  clerkUserId?: string;
  createdAt?: string;
  profileImage?: string;
}

export interface NavigationItem {
  id: ViewState;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface UserProgress {
  points: number;
  streak: number;
  lastCheckInDate: string | null;
  level: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  dueDate?: string;
  createdAt?: string;
  completed: boolean;
  progress: number;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  color: string;
  completedDates: string[];
  lastCompleted?: string;
  currentCount?: number;
  targetCount?: number;
  streak?: number;
}

export interface SafetyPlan {
  id: string;
  triggers: string[];
  copingStrategies: string[];
  supportContacts: string | Array<{ name: string; phone: string }>;
  emergencyActions: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  requirement: string;
}

export interface WearableData {
  steps: number;
  heartRate: number;
  sleepHours: number;
  lastSync: string | null;
}

export type VolunteerStatus = 'pending' | 'approved' | 'active' | 'inactive' | 'rejected';

export interface VolunteerInvite {
  id: string;
  email: string;
  role: string;
  status: VolunteerStatus;
  inviteToken: string;
  invitedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  invitedBy: string;
}

export interface VolunteerProfile extends User {
  volunteerRole: string;
  volunteerStatus: VolunteerStatus;
  approvalDate?: string;
  hoursContributed: number;
  activeCampaigns: string[];
  joinDate: string;
}
