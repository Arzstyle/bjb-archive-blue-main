export type MenuKey =
  | "slik"
  | "taspen"
  | "mutasi_rekening"
  | "amola"
  | "sitanti"
  | "kolateral"
  | "berkas_lunas";

export type Division = "konsumer" | "ritel" | "mikro" | "admin";

export type Role = "admin" | "konsumer" | "ritel" | "mikro";

export interface MenuDef {
  key: MenuKey;
  label: string;
  adminOnly: boolean;
  icon: string; // lucide icon name
}

export const MENUS: MenuDef[] = [
  { key: "slik", label: "SLIK", adminOnly: false, icon: "FileSearch" },
  { key: "taspen", label: "TASPEN", adminOnly: false, icon: "Wallet" },
  { key: "mutasi_rekening", label: "Mutasi Rekening", adminOnly: false, icon: "ArrowLeftRight" },
  { key: "amola", label: "AMOLA", adminOnly: false, icon: "Banknote" },
  { key: "sitanti", label: "SITANTI", adminOnly: true, icon: "ShieldCheck" },
  { key: "kolateral", label: "Kolateral", adminOnly: true, icon: "Landmark" },
  { key: "berkas_lunas", label: "Berkas Lunas", adminOnly: true, icon: "CheckCircle2" },
];

export const DIVISIONS: { key: Division; label: string }[] = [
  { key: "konsumer", label: "Konsumer" },
  { key: "ritel", label: "Ritel" },
  { key: "mikro", label: "Mikro" },
];

export function canAccessMenu(role: Role, menu: MenuKey): boolean {
  const m = MENUS.find((x) => x.key === menu);
  if (!m) return false;
  if (role === "admin") return true;
  return !m.adminOnly;
}

export function accessibleDivisions(role: Role, menu: MenuKey): Division[] {
  const m = MENUS.find((x) => x.key === menu);
  if (!m) return [];
  if (m.adminOnly) return role === "admin" ? ["admin"] : [];
  if (role === "admin") return ["konsumer", "ritel", "mikro"];
  return [role];
}

export function menuLabel(key: MenuKey): string {
  return MENUS.find((m) => m.key === key)?.label ?? key;
}

export function divisionLabel(key: Division): string {
  if (key === "admin") return "Admin";
  return DIVISIONS.find((d) => d.key === key)?.label ?? key;
}

// Username: 4 chars, uppercase letters + digits
export const USERNAME_REGEX = /^[A-Z0-9]{4}$/;
// Password: min 8, must include letter, digit, and one of @#$%&!
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@#$%&!]).{8,}$/;

export function usernameToEmail(u: string): string {
  return `${u.toUpperCase()}@bjb.internal`;
}