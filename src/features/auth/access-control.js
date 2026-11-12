// Fonte única das regras de navegação e ações por perfil.
// A autorização definitiva também deve ser aplicada no servidor e no banco (RLS).
export const ROLES = Object.freeze({
  PATIENT: "patient",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
  ADMIN: "admin",
});

export const PERMISSIONS = Object.freeze({
  VIEW_OWN_APPOINTMENTS: "view_own_appointments",
  MANAGE_OWN_APPOINTMENTS: "manage_own_appointments",
  VIEW_OWN_SCHEDULE: "view_own_schedule",
  VIEW_CLINIC_SCHEDULE: "view_clinic_schedule",
  MANAGE_STAFF: "manage_staff",
  MANAGE_PROFESSIONALS: "manage_professionals",
  CONTACT_PATIENT: "contact_patient",
});

const permissionsByRole = Object.freeze({
  [ROLES.PATIENT]: [
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
    PERMISSIONS.MANAGE_OWN_APPOINTMENTS,
  ],
  [ROLES.DOCTOR]: [
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
    PERMISSIONS.VIEW_OWN_SCHEDULE,
  ],
  [ROLES.RECEPTIONIST]: [
    PERMISSIONS.VIEW_CLINIC_SCHEDULE,
    PERMISSIONS.CONTACT_PATIENT,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_CLINIC_SCHEDULE,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.MANAGE_PROFESSIONALS,
  ],
});

export const HOME_BY_ROLE = Object.freeze({
  [ROLES.PATIENT]: "/dashboard",
  [ROLES.DOCTOR]: "/medico",
  [ROLES.RECEPTIONIST]: "/secretaria",
  [ROLES.ADMIN]: "/administracao",
});

export function hasPermission(role, permission) {
  return permissionsByRole[role]?.includes(permission) ?? false;
}

export function homeForRole(role) {
  return HOME_BY_ROLE[role] ?? null;
}

export function isAllowedRole(role) {
  return Object.hasOwn(permissionsByRole, role);
}
