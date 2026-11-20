function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

// Filters only the records already authorized and returned by the server.
export function filterStaff(staff, { query = "", role = "all", status = "all" } = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return staff.filter((member) => {
    if (role !== "all" && member.staff_role !== role) return false;
    if (status === "active" && !member.active) return false;
    if (status === "inactive" && member.active) return false;
    const searchable = normalize(`${member.full_name ?? ""} ${member.email ?? ""}`);
    return terms.every((term) => searchable.includes(term));
  });
}
