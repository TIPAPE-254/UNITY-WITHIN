import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Activity, Eye, Clock, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../constants';

type VolunteerRow = {
  id: number;
  name: string | null;
  email: string;
  status: string;
};

type ApprovedRow = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  approved_at: string | null;
  activated_at: string | null;
  role_display_name?: string | null;
};

type UserRow = {
  id: number;
  email: string;
  role?: string;
};

type HourRow = {
  id: number;
  volunteer_id: number;
  email?: string | null;
  name?: string | null;
  description?: string | null;
  hours: number;
  logged_at?: string | null;
};

type TaskRow = {
  id: number;
  volunteer_id: number;
  email?: string | null;
  name?: string | null;
  title: string;
  category?: string | null;
  due_date?: string | null;
  completed?: boolean;
};

type VolunteerActivityPayload = {
  summary: {
    id: number;
    name: string | null;
    email: string;
    status: string;
    total_hours: number;
  } | null;
  hours: Array<{ id: number; description?: string | null; hours: number; logged_at?: string | null }>;
  tasks: Array<{ id: number; title: string; category?: string | null; due_date?: string | null; completed?: boolean }>;
};

type VolunteerMetrics = {
  volunteerId: number;
  email: string;
  name: string;
  status: string;
  portalVisible: boolean;
  approved: boolean;
  activated: boolean;
  role: string;
  totalHours: number;
  completedTasks: number;
  pendingTasks: number;
  lastActivity: string | null;
};

type PipelineRow = {
  email: string;
  invite_id?: number | null;
  invite_status?: string | null;
  invited_at?: string | null;
  invite_expires_at?: string | null;
  application_id?: number | null;
  application_status?: string | null;
  application_created_at?: string | null;
  approval_id?: number | null;
  approved_at?: string | null;
  activated_at?: string | null;
  approved_by?: string | null;
  user_id?: number | null;
  user_role?: string | null;
  volunteer_id?: number | null;
  volunteer_name?: string | null;
  volunteer_status?: string | null;
  volunteer_created_at?: string | null;
  portal_visible: boolean;
  pipeline_stage: string;
};

const EMPTY_ACTIVITY: VolunteerActivityPayload = {
  summary: null,
  hours: [],
  tasks: [],
};

export const AdminVolunteerPortalMonitor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [approved, setApproved] = useState<ApprovedRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [hours, setHours] = useState<HourRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [pipeline, setPipeline] = useState<PipelineRow[]>([]);

  const [query, setQuery] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<number | null>(null);
  const [selectedPipelineEmail, setSelectedPipelineEmail] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<VolunteerActivityPayload>(EMPTY_ACTIVITY);
  const [activityLoading, setActivityLoading] = useState(false);
  const [trackingVolunteerId, setTrackingVolunteerId] = useState<number | null>(null);
  const activityDetailRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToActivityDetail = useCallback(() => {
    requestAnimationFrame(() => {
      activityDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const getIdentityHeaders = useCallback((): Record<string, string> => {
    const raw = localStorage.getItem('user');
    let user: any = null;
    try {
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user?.email) headers['x-user-email'] = String(user.email);
    if (user?.id) headers['x-user-id'] = String(user.id);
    if (user?.role) headers['x-role'] = String(user.role);

    return headers;
  }, []);

  const apiFetch = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      method: init?.method || 'GET',
      headers: {
        ...getIdentityHeaders(),
        ...(init?.headers || {}),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
      body: init?.body,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `Request failed: ${response.status}`);
    }
    return payload;
  }, [getIdentityHeaders]);

  const loadData = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const [volunteerRes, approvedRes, usersRes, hoursRes, tasksRes, pipelineRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/admin/volunteers`),
        apiFetch(`${API_BASE_URL}/admin/approved-volunteers`),
        apiFetch(`${API_BASE_URL}/admin/users`),
        apiFetch(`${API_BASE_URL}/admin/volunteer-hours`),
        apiFetch(`${API_BASE_URL}/admin/volunteer-tasks`),
        apiFetch(`${API_BASE_URL}/admin/volunteer-pipeline`),
      ]);

      setVolunteers(Array.isArray(volunteerRes?.data) ? volunteerRes.data : []);
      setApproved(Array.isArray(approvedRes?.data) ? approvedRes.data : []);
      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
      setHours(Array.isArray(hoursRes?.data) ? hoursRes.data : []);
      setTasks(Array.isArray(tasksRes?.data) ? tasksRes.data : []);
      setPipeline(Array.isArray(pipelineRes?.data) ? pipelineRes.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load volunteer monitor data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  const metrics = useMemo<VolunteerMetrics[]>(() => {
    const approvedByEmail = new Map(approved.map((row) => [row.email.toLowerCase(), row]));
    const usersByEmail = new Map(users.map((row) => [String(row.email || '').toLowerCase(), row]));

    const hoursByVolunteer = new Map<number, HourRow[]>();
    const taskByVolunteer = new Map<number, TaskRow[]>();

    for (const hour of hours) {
      const list = hoursByVolunteer.get(hour.volunteer_id) || [];
      list.push(hour);
      hoursByVolunteer.set(hour.volunteer_id, list);
    }

    for (const task of tasks) {
      const list = taskByVolunteer.get(task.volunteer_id) || [];
      list.push(task);
      taskByVolunteer.set(task.volunteer_id, list);
    }

    return volunteers.map((volunteer) => {
      const email = String(volunteer.email || '').toLowerCase();
      const approval = approvedByEmail.get(email);
      const account = usersByEmail.get(email);

      const hourRows = hoursByVolunteer.get(volunteer.id) || [];
      const taskRows = taskByVolunteer.get(volunteer.id) || [];

      const totalHours = hourRows.reduce((sum, row) => sum + Number(row.hours || 0), 0);
      const completedTasks = taskRows.filter((row) => Boolean(row.completed)).length;
      const pendingTasks = taskRows.length - completedTasks;

      const lastHour = hourRows
        .map((row) => row.logged_at)
        .filter(Boolean)
        .map((value) => new Date(String(value)).getTime())
        .sort((a, b) => b - a)[0];

      const status = String(volunteer.status || '').toLowerCase();
      const approvedStatus = status === 'approved' || status === 'active' || Boolean(approval);
      const activated = Boolean(approval?.activated_at) || status === 'active';
      const portalVisible = Boolean(account?.role === 'volunteer') && approvedStatus;

      const fallbackName = volunteer.name || `${approval?.first_name || ''} ${approval?.last_name || ''}`.trim();

      return {
        volunteerId: volunteer.id,
        email: volunteer.email,
        name: fallbackName || volunteer.email,
        status: volunteer.status || 'unknown',
        portalVisible,
        approved: approvedStatus,
        activated,
        role: approval?.role_display_name || 'Volunteer',
        totalHours,
        completedTasks,
        pendingTasks,
        lastActivity: lastHour ? new Date(lastHour).toISOString() : null,
      };
    });
  }, [approved, hours, tasks, users, volunteers]);

  const filteredMetrics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return metrics;
    return metrics.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.role.toLowerCase().includes(q),
    );
  }, [metrics, query]);

  const summary = useMemo(() => {
    const total = metrics.length;
    const visible = metrics.filter((item) => item.portalVisible).length;
    const approvedCount = metrics.filter((item) => item.approved).length;
    const pendingActivation = metrics.filter((item) => item.approved && !item.activated).length;
    return { total, visible, approvedCount, pendingActivation };
  }, [metrics]);

  const filteredPipeline = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pipeline;
    return pipeline.filter((row) => {
      const email = String(row.email || '').toLowerCase();
      const name = String(row.volunteer_name || '').toLowerCase();
      const stage = String(row.pipeline_stage || '').toLowerCase();
      return email.includes(q) || name.includes(q) || stage.includes(q);
    });
  }, [pipeline, query]);

  const selectedPipeline = useMemo(() => {
    if (!selectedPipelineEmail) return null;
    return pipeline.find((row) => String(row.email || '').toLowerCase() === selectedPipelineEmail.toLowerCase()) || null;
  }, [pipeline, selectedPipelineEmail]);

  const loadVolunteerActivity = useCallback(async (volunteerId: number) => {
    setSelectedVolunteerId(volunteerId);
    setError(null);
    setActivityLoading(true);
    try {
      const payload = await apiFetch(`${API_BASE_URL}/admin/volunteer-activity?volunteerId=${encodeURIComponent(String(volunteerId))}`);
      setSelectedActivity({
        summary: payload?.summary || null,
        hours: Array.isArray(payload?.hours) ? payload.hours : [],
        tasks: Array.isArray(payload?.tasks) ? payload.tasks : [],
      });
    } catch (err) {
      setSelectedActivity(EMPTY_ACTIVITY);
      setError(err instanceof Error ? err.message : 'Failed to load volunteer activity');
    } finally {
      setActivityLoading(false);
    }
  }, [apiFetch]);

  const openVolunteerTrack = useCallback(async (metric: VolunteerMetrics) => {
    setTrackingVolunteerId(metric.volunteerId);
    setSelectedPipelineEmail(metric.email);
    setSelectedActivity(EMPTY_ACTIVITY);
    scrollToActivityDetail();
    try {
      await loadVolunteerActivity(metric.volunteerId);
    } finally {
      setTrackingVolunteerId(null);
    }
  }, [loadVolunteerActivity, scrollToActivityDetail]);

  const openPipelineTrack = useCallback(async (row: PipelineRow) => {
    setSelectedPipelineEmail(row.email);
    if (!row.volunteer_id) {
      setError('This account has no active volunteer record yet. Approve and activate first to track work.');
      return;
    }
    setTrackingVolunteerId(row.volunteer_id);
    setSelectedActivity(EMPTY_ACTIVITY);
    scrollToActivityDetail();
    try {
      await loadVolunteerActivity(row.volunteer_id);
    } finally {
      setTrackingVolunteerId(null);
    }
  }, [loadVolunteerActivity, scrollToActivityDetail]);

  const stageLabel = (stage: string) => {
    switch (stage) {
      case 'portal_visible':
        return 'Portal Visible';
      case 'approved_pending_activation':
        return 'Approved Pending Activation';
      case 'application_review':
        return 'In Application Review';
      case 'invited':
        return 'Invited';
      default:
        return 'No Pipeline Record';
    }
  };

  const handleDeleteVolunteer = useCallback(async (volunteerId: number, label: string) => {
    const ok = window.confirm(`Delete volunteer ${label}? This will remove the volunteer record and revoke volunteer access.`);
    if (!ok) return;

    setError(null);
    try {
      await apiFetch(`${API_BASE_URL}/admin/volunteer/${encodeURIComponent(String(volunteerId))}`, {
        method: 'DELETE',
      });

      if (selectedVolunteerId === volunteerId) {
        setSelectedVolunteerId(null);
        setSelectedActivity(EMPTY_ACTIVITY);
      }

      await loadData(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete volunteer');
    }
  }, [apiFetch, loadData, selectedVolunteerId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-unity-100 p-8 flex items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-unity-200 border-t-unity-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-unity-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-unity-black">Volunteer Portal Monitor</h2>
            <p className="text-sm text-gray-500">Track portal visibility and volunteer activity across approved accounts.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadData(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-unity-200 text-unity-700 hover:bg-unity-50 disabled:opacity-60"
          >
            <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-unity-100 p-4 bg-unity-50/40">
            <p className="text-xs uppercase tracking-wider text-gray-500">Total volunteers</p>
            <p className="text-2xl font-bold text-unity-black mt-1">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-green-100 p-4 bg-green-50/60">
            <p className="text-xs uppercase tracking-wider text-green-700">Portal visible</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{summary.visible}</p>
          </div>
          <div className="rounded-xl border border-blue-100 p-4 bg-blue-50/60">
            <p className="text-xs uppercase tracking-wider text-blue-700">Approved accounts</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{summary.approvedCount}</p>
          </div>
          <div className="rounded-xl border border-amber-100 p-4 bg-amber-50/60">
            <p className="text-xs uppercase tracking-wider text-amber-700">Pending activation</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{summary.pendingActivation}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-unity-100 p-6">
        <div className="flex items-center gap-2 rounded-xl border border-unity-100 px-3 py-2 bg-gray-50">
          <Search size={16} className="text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email or role"
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500 bg-gray-50">
              <tr>
                <th className="px-3 py-2">Volunteer</th>
                <th className="px-3 py-2">Portal visibility</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Hours</th>
                <th className="px-3 py-2">Tasks</th>
                <th className="px-3 py-2">Last activity</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((item) => (
                <tr key={item.volunteerId} className="border-t border-gray-100">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-unity-black">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${item.portalVisible ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <Eye size={12} />
                      {item.portalVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${item.approved ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      <Users size={12} />
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-unity-black">{item.totalHours.toFixed(1)}</td>
                  <td className="px-3 py-3">
                    <span className="text-gray-700">{item.completedTasks} done</span>
                    <span className="text-gray-400"> / {item.pendingTasks} pending</span>
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    {item.lastActivity ? new Date(item.lastActivity).toLocaleString() : 'No activity'}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void openVolunteerTrack(item)}
                        disabled={activityLoading && trackingVolunteerId === item.volunteerId}
                        className="px-3 py-1.5 rounded-lg bg-unity-50 text-unity-700 hover:bg-unity-100 text-xs font-semibold"
                      >
                        {activityLoading && trackingVolunteerId === item.volunteerId ? 'Tracking...' : 'Tap to track'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteVolunteer(item.volunteerId, item.name || item.email)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMetrics.length === 0 && (
            <div className="py-10 text-center text-gray-500">No volunteers match your search.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-unity-100 p-6">
        <h3 className="text-lg font-bold text-unity-black">Volunteer Pipeline Tracker</h3>
        <p className="text-sm text-gray-500 mt-1">Tap any row to inspect invite, application, approval, activation, and visibility state.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500 bg-gray-50">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Current stage</th>
                <th className="px-3 py-2">Invite</th>
                <th className="px-3 py-2">Application</th>
                <th className="px-3 py-2">Approval</th>
                <th className="px-3 py-2">Portal</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPipeline.map((row) => {
                const active = selectedPipelineEmail && selectedPipelineEmail.toLowerCase() === String(row.email || '').toLowerCase();
                return (
                  <tr
                    key={row.email}
                    onClick={() => setSelectedPipelineEmail(row.email)}
                    className={`border-t border-gray-100 cursor-pointer ${active ? 'bg-unity-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-3 py-3">
                      <p className="font-semibold text-unity-black">{row.volunteer_name || row.email}</p>
                      <p className="text-xs text-gray-500">{row.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {stageLabel(String(row.pipeline_stage || ''))}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{row.invite_status || '-'}</td>
                    <td className="px-3 py-3 text-gray-600">{row.application_status || '-'}</td>
                    <td className="px-3 py-3 text-gray-600">{row.approved_at ? 'Approved' : '-'}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${row.portal_visible ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <Eye size={12} />
                        {row.portal_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void openPipelineTrack(row);
                          }}
                          disabled={!row.volunteer_id || (activityLoading && trackingVolunteerId === row.volunteer_id)}
                          className="px-3 py-1.5 rounded-lg bg-unity-50 text-unity-700 hover:bg-unity-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold"
                        >
                          {activityLoading && trackingVolunteerId === row.volunteer_id ? 'Tracking...' : 'Tap to track'}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (row.volunteer_id) {
                              void handleDeleteVolunteer(row.volunteer_id, row.volunteer_name || row.email);
                            }
                          }}
                          disabled={!row.volunteer_id}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredPipeline.length === 0 && (
            <div className="py-8 text-center text-gray-500">No pipeline records found.</div>
          )}
        </div>

        {selectedPipeline && (
          <div className="mt-5 rounded-xl border border-unity-100 p-4 bg-unity-50/30">
            <h4 className="font-bold text-unity-black">Pipeline detail for {selectedPipeline.email}</h4>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white border border-gray-100 p-3">
                <p className="font-semibold text-gray-700">Invite stage</p>
                <p className="text-gray-600 mt-1">Status: {selectedPipeline.invite_status || 'not invited'}</p>
                <p className="text-gray-500 text-xs mt-1">Sent: {selectedPipeline.invited_at ? new Date(selectedPipeline.invited_at).toLocaleString() : '-'}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 p-3">
                <p className="font-semibold text-gray-700">Application stage</p>
                <p className="text-gray-600 mt-1">Status: {selectedPipeline.application_status || 'not submitted'}</p>
                <p className="text-gray-500 text-xs mt-1">Created: {selectedPipeline.application_created_at ? new Date(selectedPipeline.application_created_at).toLocaleString() : '-'}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 p-3">
                <p className="font-semibold text-gray-700">Approval stage</p>
                <p className="text-gray-600 mt-1">Approved: {selectedPipeline.approved_at ? 'yes' : 'no'}</p>
                <p className="text-gray-500 text-xs mt-1">By: {selectedPipeline.approved_by || '-'}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 p-3">
                <p className="font-semibold text-gray-700">Account visibility</p>
                <p className="text-gray-600 mt-1">User role: {selectedPipeline.user_role || '-'}</p>
                <p className="text-gray-500 text-xs mt-1">Portal: {selectedPipeline.portal_visible ? 'visible to volunteer account' : 'not visible yet'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={activityDetailRef} className="bg-white rounded-2xl border border-unity-100 p-6">
        <h3 className="text-lg font-bold text-unity-black">Volunteer activity detail</h3>
        {!selectedVolunteerId ? (
          <p className="text-sm text-gray-500 mt-2">Choose a volunteer from the table to inspect tasks and logged hours.</p>
        ) : activityLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <RefreshCcw size={14} className="animate-spin" />
            Loading activity...
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {selectedActivity.summary && (
              <div className="rounded-xl border border-unity-100 bg-unity-50/40 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Currently tracking</p>
                <p className="text-base font-bold text-unity-black mt-1">
                  {selectedActivity.summary.name || selectedActivity.summary.email}
                </p>
                <p className="text-sm text-gray-600">{selectedActivity.summary.email}</p>
                <p className="text-sm text-gray-700 mt-1">
                  Status: <span className="font-semibold">{selectedActivity.summary.status || 'unknown'}</span>
                  {' '}• Total Hours: <span className="font-semibold">{Number(selectedActivity.summary.total_hours || 0).toFixed(1)}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="font-semibold text-unity-black mb-2 flex items-center gap-2"><Clock size={16} /> Recent hours</h4>
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {selectedActivity.hours.length === 0 ? (
                  <p className="text-sm text-gray-500">No logged hours yet.</p>
                ) : selectedActivity.hours.map((row) => (
                  <div key={row.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-sm font-medium text-unity-black">{Number(row.hours || 0).toFixed(1)} hrs</p>
                    <p className="text-xs text-gray-600">{row.description || 'No description'}</p>
                    <p className="text-[11px] text-gray-400">{row.logged_at ? new Date(String(row.logged_at)).toLocaleString() : '-'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="font-semibold text-unity-black mb-2 flex items-center gap-2"><Activity size={16} /> Tasks</h4>
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {selectedActivity.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">No tasks assigned yet.</p>
                ) : selectedActivity.tasks.map((row) => (
                  <div key={row.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-sm font-medium text-unity-black">{row.title}</p>
                    <p className="text-xs text-gray-600">{row.category || 'General'}</p>
                    <p className="text-[11px] text-gray-400">
                      {row.completed ? 'Completed' : 'Pending'}
                      {row.due_date ? ` • Due ${new Date(String(row.due_date)).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
