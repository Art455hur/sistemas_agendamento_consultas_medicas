// Decide para onde cada perfil vai depois do login e quais áreas ele pode abrir.
// O papel vem sempre do banco (public.profiles + public.hospital_staff), lido com a
// sessão do próprio usuário e RLS. Nunca use e-mail, formulário ou user_metadata.
// Isto organiza a navegação; as páginas e o banco continuam aplicando a autorização.
import { homeForRole, isAllowedRole, ROLES } from "./access-control.js";
import { safeRedirect } from "../../shared/security/redirect.js";

export const CLINIC_HOSPITAL_ID = 1;

const STAFF_ROLES = new Set([ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN]);

const AREAS_BY_ROLE = Object.freeze({
  [ROLES.PATIENT]: ["/dashboard", "/agendar", "/agendamentos", "/perfil", "/confirmacao"],
  [ROLES.DOCTOR]: ["/medico"],
  [ROLES.RECEPTIONIST]: ["/secretaria"],
  [ROLES.ADMIN]: ["/administracao"],
});

export const PROTECTED_PATHS = Object.freeze(Object.values(AREAS_BY_ROLE).flat());

function matches(pathname, base) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isStaffRole(role) {
  return STAFF_ROLES.has(role);
}

export function isProtectedPath(pathname) {
  return PROTECTED_PATHS.some((base) => matches(pathname, base));
}

// Papel utilizável: conhecido e, para funcionários, com vínculo ativo na clínica.
export function effectiveRole(access) {
  const role = access?.role;
  if (!isAllowedRole(role)) return null;
  if (isStaffRole(role) && access.staffActive !== true) return null;
  return role;
}

export function canAccessPath(role, pathname) {
  return (AREAS_BY_ROLE[role] ?? []).some((base) => matches(pathname, base));
}

// Retorna o link interno pedido, se o perfil puder abri-lo; senão, a página inicial do perfil.
// Retorna null quando a conta não tem acesso a nenhuma área.
export function destinationFor(access, requested) {
  const role = effectiveRole(access);
  if (!role) return null;
  const safe = safeRedirect(requested);
  if (safe) {
    const { pathname } = new URL(safe, "https://internal.invalid");
    if (canAccessPath(role, pathname)) return safe;
  }
  return homeForRole(role);
}

// Destino pedido na URL do login: ?redirect=... ou a escolha de especialidade da página inicial.
export function requestedFromLoginParams(parameters) {
  const redirect = safeRedirect(parameters.get("redirect"));
  if (redirect) return redirect;
  const specialty = parameters.get("especialidade");
  if (!specialty) return null;
  const booking = new URLSearchParams({ especialidade: specialty });
  const doctor = parameters.get("profissional");
  if (doctor) booking.set("profissional", doctor);
  return `/agendar?${booking}`;
}

// Lê o papel e o vínculo com o cliente Supabase da sessão (navegador ou servidor).
export async function loadAccess(supabase, userId) {
  if (!userId) return { role: null, staffActive: false };
  const { data: profile, error } = await supabase.from("profiles")
    .select("role").eq("id", userId).maybeSingle();
  if (error) return { error };
  const role = profile?.role ?? null;
  if (!isStaffRole(role)) return { role, staffActive: false };
  const { data: link, error: linkError } = await supabase.from("hospital_staff")
    .select("active").eq("profile_id", userId).eq("hospital_id", CLINIC_HOSPITAL_ID).maybeSingle();
  if (linkError) return { error: linkError };
  return { role, staffActive: link?.active === true };
}
