import { useMemo } from 'react';
import { useAuth } from './useAuth';

export type PermissionKey =
  | 'view_dashboard'
  | 'manage_customers'
  | 'manage_deals'
  | 'view_team_reports'
  | 'manage_team_targets'
  | 'manage_sales_staff'
  | 'system_settings'
  | 'view_audit_logs'
  | 'view_cost_price'
  | 'manage_products'
  | 'manage_pipeline'
  | 'approve_quotes';

export type DataScopeType = 'OWN' | 'TEAM' | 'ALL';

const ROLE_PERMISSIONS_MAP: Record<string, PermissionKey[]> = {
  'super admin': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
    'view_team_reports',
    'manage_team_targets',
    'manage_sales_staff',
    'system_settings',
    'view_audit_logs',
    'view_cost_price',
    'manage_products',
    'manage_pipeline',
    'approve_quotes',
  ],
  'admin': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
    'view_team_reports',
    'manage_team_targets',
    'manage_sales_staff',
    'system_settings',
    'view_audit_logs',
    'view_cost_price',
    'manage_products',
    'manage_pipeline',
    'approve_quotes',
  ],
  'vp of sales': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
    'view_team_reports',
    'manage_team_targets',
    'view_cost_price',
    'manage_products',
    'manage_pipeline',
    'approve_quotes',
  ],
  'director': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
    'view_team_reports',
    'manage_team_targets',
    'view_cost_price',
    'manage_products',
    'manage_pipeline',
    'approve_quotes',
  ],
  'sales director': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
    'view_team_reports',
    'manage_team_targets',
    'view_cost_price',
    'manage_products',
    'manage_pipeline',
    'approve_quotes',
  ],
  'sales manager': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
    'view_team_reports',
    'manage_team_targets',
    'approve_quotes',
  ],
  'team leader': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
    'view_team_reports',
    'manage_team_targets',
    'approve_quotes',
  ],
  'revops lead': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
    'view_team_reports',
    'manage_team_targets',
    'view_audit_logs',
    'manage_pipeline',
  ],
  'account executive': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
  ],
  'sales rep': [
    'view_dashboard',
    'manage_customers',
    'manage_deals',
  ],
};

const ROLE_DATA_SCOPE_MAPPING: Record<string, DataScopeType> = {
  'super admin': 'ALL',
  'admin': 'ALL',
  'vp of sales': 'ALL',
  'director': 'ALL',
  'sales director': 'ALL',
  'sales manager': 'TEAM',
  'team leader': 'TEAM',
  'revops lead': 'TEAM',
  'account executive': 'OWN',
  'sales rep': 'OWN',
};

export interface IAuthorizationResult {
  role: string;
  normalizedRole: string;
  dataScope: DataScopeType;
  isAdmin: boolean;
  isDirector: boolean;
  isLeader: boolean;
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
  canAccessRoute: (path: string) => boolean;
  permissions: PermissionKey[];
}

export const useAuthorization = (): IAuthorizationResult => {
  const { user } = useAuth();
  const role = user?.role || 'Account Executive';
  const normalizedRole = role.toLowerCase().trim();

  const permissions = useMemo<PermissionKey[]>(() => {
    return ROLE_PERMISSIONS_MAP[normalizedRole] || [
      'view_dashboard',
      'manage_customers',
      'manage_deals',
    ];
  }, [normalizedRole]);

  const dataScope = useMemo<DataScopeType>(() => {
    return ROLE_DATA_SCOPE_MAPPING[normalizedRole] || 'OWN';
  }, [normalizedRole]);

  const isAdmin = useMemo<boolean>(() => {
    return (
      normalizedRole === 'super admin' ||
      normalizedRole === 'admin' ||
      normalizedRole.includes('admin')
    );
  }, [normalizedRole]);

  const isDirector = useMemo<boolean>(() => {
    return (
      isAdmin ||
      normalizedRole.includes('director') ||
      normalizedRole.includes('vp') ||
      normalizedRole.includes('giám đốc')
    );
  }, [isAdmin, normalizedRole]);

  const isLeader = useMemo<boolean>(() => {
    return (
      isDirector ||
      normalizedRole.includes('manager') ||
      normalizedRole.includes('leader') ||
      normalizedRole.includes('lead')
    );
  }, [isDirector, normalizedRole]);

  const hasPermission = (perm: PermissionKey): boolean => {
    return permissions.includes(perm);
  };

  const hasAnyPermission = (perms: PermissionKey[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (perms: PermissionKey[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  const canAccessRoute = (path: string): boolean => {
    if (path.startsWith('/quotes/approvals')) {
      return hasPermission('approve_quotes');
    }
    if (path.startsWith('/users') || path.startsWith('/staff-management')) {
      return hasPermission('manage_sales_staff');
    }
    if (path.startsWith('/settings')) {
      return hasPermission('system_settings');
    }
    if (path.startsWith('/reports') || path.startsWith('/team-reports')) {
      return hasPermission('view_team_reports');
    }
    if (path.startsWith('/audit-logs')) {
      return hasPermission('view_audit_logs');
    }
    if (path.startsWith('/products')) {
      return hasPermission('manage_products');
    }
    return true;
  };

  return {
    role,
    normalizedRole,
    dataScope,
    isAdmin,
    isDirector,
    isLeader,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    permissions,
  };
};
