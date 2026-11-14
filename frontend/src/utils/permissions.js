export function canManageRecords(role) {
  return ["manager", "admin"].includes(role?.toLowerCase());
}

export function canManageTeam(role) {
  return canManageRecords(role);
}
