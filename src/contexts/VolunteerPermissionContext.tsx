import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface VolunteerRole {
  name: string;
  display_name: string;
}

interface PermissionOverride {
  permission: string;
  allowed: boolean;
  granted_by: string;
  reason: string | null;
  created_at: string;
}

interface VolunteerPermissionContextType {
  /** Set of granted permission names */
  permissions: Set<string>;
  /** Current RBAC role */
  role: VolunteerRole | null;
  /** Per-volunteer overrides (for admin display) */
  overrides: PermissionOverride[];
  /** Check if the volunteer has a specific permission */
  can: (permission: string) => boolean;
  /** True while first load is in progress */
  loading: boolean;
  /** True if the volunteer has at least dashboard access */
  isVolunteer: boolean;
  /** Manually re-fetch permissions (call after admin changes) */
  refresh: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────
const VolunteerPermissionContext = createContext<VolunteerPermissionContextType>({
  permissions: new Set(),
  role: null,
  overrides: [],
  can: () => false,
  loading: true,
  isVolunteer: false,
  refresh: async () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────
interface Props {
  children: React.ReactNode;
  userEmail: string | null;
  /** Pass true when you already know the user is not a volunteer (skips the fetch) */
  skip?: boolean;
}

export function VolunteerPermissionProvider({ children, userEmail, skip = false }: Props) {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<VolunteerRole | null>(null);
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [loading, setLoading] = useState(!skip);

  const fetchPermissions = useCallback(async () => {
    if (skip || !userEmail) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch("/api/volunteer/permissions/me", {
        headers: { "x-user-email": userEmail },
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setPermissions(new Set<string>(data.permissions || []));
          setRole(data.role || null);
          setOverrides(data.overrides || []);
        }
      } else {
        // Not a volunteer or not approved — clear everything
        setPermissions(new Set());
        setRole(null);
        setOverrides([]);
      }
    } catch (err) {
      console.error("Failed to load volunteer permissions:", err);
      setPermissions(new Set());
    } finally {
      setLoading(false);
    }
  }, [userEmail, skip]);

  // Fetch on mount and when email changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const can = useCallback(
    (permission: string): boolean => permissions.has(permission),
    [permissions]
  );

  const isVolunteer = permissions.has("volunteer.dashboard");

  return (
    <VolunteerPermissionContext.Provider
      value={{ permissions, role, overrides, can, loading, isVolunteer, refresh: fetchPermissions }}
    >
      {children}
    </VolunteerPermissionContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useVolunteerPermissions(): VolunteerPermissionContextType {
  return useContext(VolunteerPermissionContext);
}

export default VolunteerPermissionContext;
