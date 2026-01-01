const ADMIN_ROLES = ['org:admin', 'admin', 'super_admin', 'org:super_admin'];

export function checkIsAdmin(role?: string): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role);
}
