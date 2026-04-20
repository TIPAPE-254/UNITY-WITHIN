import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Shield, Settings, X, Save, Trash2, Plus } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  permission_count: number;
  permissions: Permission[];
}

interface Permission {
  id: number;
  name: string;
  display_name: string;
  category: string;
}

interface VolunteerPermissions {
  volunteer: {
    id: number;
    email: string;
    name: string;
    status: string;
    role: Role | null;
  };
  rolePermissions: Permission[];
  overrides: PermissionOverride[];
}

interface PermissionOverride {
  id: number;
  permission_id: number;
  name: string;
  display_name: string;
  category: string;
  allowed: boolean;
  granted_by: string;
  reason?: string;
  created_at: string;
}

interface Volunteer {
  id: number;
  email: string;
  name: string;
  status: string;
  rbac_role_id?: number;
}

export const VolunteerRBACManager: React.FC<{
  volunteerId: number;
  onClose?: () => void;
}> = ({ volunteerId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [volunteerData, setVolunteerData] = useState<VolunteerPermissions | null>(null);
  
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [expandedOverrides, setExpandedOverrides] = useState<Set<number>>(new Set());
  const [showAddOverride, setShowAddOverride] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
  const [overrideAllowed, setOverrideAllowed] = useState(true);
  const [overrideReason, setOverrideReason] = useState('');

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, [volunteerId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch roles
      const rolesRes = await fetch('/api/admin/volunteer-rbac/roles', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);
      }

      // Fetch permissions
      const permsRes = await fetch('/api/admin/volunteer-rbac/permissions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (permsRes.ok) {
        const permsData = await permsRes.json();
        setPermissions(permsData.permissions || []);
      }

      // Fetch volunteer permissions
      const volRes = await fetch(`/api/admin/volunteer-rbac/${volunteerId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (volRes.ok) {
        const volData = await volRes.json();
        setVolunteerData(volData);
        setSelectedRole(volData.volunteer.role?.id || null);
      } else {
        setError('Failed to load volunteer data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedRole || !volunteerData) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/volunteer-rbac/${volunteerId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ roleId: selectedRole })
      });

      if (res.ok) {
        setSuccess('Role updated successfully');
        await fetchAllData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating role');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOverride = async () => {
    if (!selectedPermissionId) {
      setError('Please select a permission');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/volunteer-rbac/${volunteerId}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          permissionId: selectedPermissionId,
          allowed: overrideAllowed,
          reason: overrideReason || null
        })
      });

      if (res.ok) {
        setSuccess(`Permission ${overrideAllowed ? 'granted' : 'revoked'} successfully`);
        setShowAddOverride(false);
        setSelectedPermissionId(null);
        setOverrideReason('');
        await fetchAllData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to override permission');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error overriding permission');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveOverride = async (overrideId: number) => {
    const confirmed = window.confirm('Remove this permission override?');
    if (!confirmed) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/volunteer-rbac/${volunteerId}/override/${overrideId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        setSuccess('Override removed successfully');
        await fetchAllData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to remove override');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing override');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!volunteerData) {
    return <div className="text-red-600 p-4">Failed to load volunteer data</div>;
  }

  const currentRole = roles.find(r => r.id === selectedRole);
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-600" size={24} />
          <div>
            <h2 className="text-xl font-semibold">Permission Manager</h2>
            <p className="text-sm text-gray-600">{volunteerData.volunteer.email}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-800 hover:text-red-900">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Current Role Section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-4">Assigned Role</h3>
        
        {currentRole && (
          <div className="mb-4 p-3 bg-white border border-blue-100 rounded">
            <p className="font-medium text-blue-900">{currentRole.display_name}</p>
            <p className="text-sm text-blue-700">{currentRole.description}</p>
            <div className="mt-3">
              <p className="text-sm font-medium text-blue-800 mb-2">Role Permissions ({currentRole.permission_count}):</p>
              <div className="flex flex-wrap gap-2">
                {currentRole.permissions?.map(perm => (
                  <span key={perm.id} className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {perm.display_name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Change Role</label>
          <select
            value={selectedRole || ''}
            onChange={(e) => setSelectedRole(Number(e.target.value) || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Role --</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.display_name}
              </option>
            ))}
          </select>
        </div>

        {selectedRole !== volunteerData.volunteer.role?.id && (
          <button
            onClick={handleSaveRole}
            disabled={saving || selectedRole === null}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Role Change'}
          </button>
        )}
      </div>

      {/* Permission Overrides Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Permission Overrides</h3>
          <button
            onClick={() => setShowAddOverride(!showAddOverride)}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
          >
            <Plus size={16} />
            Add Override
          </button>
        </div>

        {showAddOverride && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-3">Add Permission Override</h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Permission</label>
              <select
                value={selectedPermissionId || ''}
                onChange={(e) => setSelectedPermissionId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Select Permission --</option>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <optgroup key={category} label={category}>
                    {perms.map(perm => (
                      <option key={perm.id} value={perm.id}>
                        {perm.display_name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={overrideAllowed}
                    onChange={() => setOverrideAllowed(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Grant Permission</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!overrideAllowed}
                    onChange={() => setOverrideAllowed(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Revoke Permission</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Temporary access for special project"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddOverride}
                disabled={saving || !selectedPermissionId}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {saving ? 'Applying...' : 'Apply Override'}
              </button>
              <button
                onClick={() => setShowAddOverride(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {volunteerData.overrides.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Shield size={32} className="mx-auto mb-2 opacity-50" />
            <p>No overrides applied. Volunteer has only role-based permissions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {volunteerData.overrides.map(override => (
              <div key={override.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{override.display_name}</p>
                    <p className="text-sm text-gray-600">
                      {override.allowed ? '✓ GRANTED' : '✗ REVOKED'} by {override.granted_by}
                    </p>
                    {override.reason && <p className="text-sm text-gray-700 mt-1">{override.reason}</p>}
                    <p className="text-xs text-gray-500 mt-1">{new Date(override.created_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveOverride(override.id)}
                    disabled={saving}
                    className="p-2 text-red-600 hover:bg-red-50 rounded disabled:text-gray-400"
                    title="Remove override"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Permission Summary</h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Status:</dt>
            <dd className="font-medium text-gray-900">{volunteerData.volunteer.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Current Role:</dt>
            <dd className="font-medium text-gray-900">{currentRole?.display_name || 'None'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Role Permissions:</dt>
            <dd className="font-medium text-gray-900">{volunteerData.rolePermissions.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Active Overrides:</dt>
            <dd className="font-medium text-gray-900">{volunteerData.overrides.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Total Effective Permissions:</dt>
            <dd className="font-medium text-blue-600">
              {new Set([...volunteerData.rolePermissions.map(p => p.id), ...volunteerData.overrides.map(o => o.permission_id)]).size}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
