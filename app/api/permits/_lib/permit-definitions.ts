import type { PermitType } from "@/app/lib/permit-types";

export interface PermitTypeDefinition {
  type: PermitType;
  displayName: string;
  description: string;
}

export const PERMIT_TYPE_DEFINITIONS: PermitTypeDefinition[] = [
  {
    type: "hot_work",
    displayName: "Hot Work Permit",
    description: "Welding, cutting, grinding — ignition sources",
  },
  {
    type: "maintenance",
    displayName: "Maintenance Work Order",
    description: "Equipment maintenance / inspection",
  },
  {
    type: "chemical",
    displayName: "Chemical Handling Permit",
    description: "Hazardous substance handling",
  },
  {
    type: "confined_space",
    displayName: "Confined Space Entry",
    description: "Entry into enclosed spaces",
  },
  {
    type: "electrical",
    displayName: "Electrical Isolation",
    description: "HV/LV electrical work",
  },
];

export const PERMIT_TYPE_MAP = new Map(
  PERMIT_TYPE_DEFINITIONS.map((d) => [d.type, d]),
);
