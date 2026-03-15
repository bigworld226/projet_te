export const ADMIN_ROLE_NAMES = new Set([
  "SUPERADMIN",
  "STUDENT_MANAGER",
  "QUALITY_OFFICER",
  "SECRETARY",
  "FINANCE_MANAGER",
]);

export const MESSAGING_ADMIN_ROLE_NAMES = new Set([
  "SUPERADMIN",
  "STUDENT_MANAGER",
]);

export const STUDENT_LIKE_ROLE_NAMES = new Set([
  "STUDENT",
  "STUDENT_MENTOR",
]);

export function isAdminRole(roleName?: string | null) {
  return !!roleName && ADMIN_ROLE_NAMES.has(roleName);
}

export function isStudentLikeRole(roleName?: string | null) {
  return !!roleName && STUDENT_LIKE_ROLE_NAMES.has(roleName);
}

export function isMessagingAdminRole(roleName?: string | null) {
  return !!roleName && MESSAGING_ADMIN_ROLE_NAMES.has(roleName);
}
