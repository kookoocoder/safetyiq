export type PermitType =
  | "hot_work"
  | "maintenance"
  | "chemical"
  | "confined_space"
  | "electrical";

export type PermitStatus = "active" | "expired" | "suspended";

export interface PermitRecord {
  id: string;
  zoneId: string;
  permitType: PermitType;
  displayName: string;
  issuedBy: string;
  issuedAt: string;
  validUntil: string;
  status: PermitStatus;
}
