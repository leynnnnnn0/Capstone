import type { CustomerFabricationStatus, CustomerWorkJobFabrication } from "./types";

export const fabricationStages: CustomerFabricationStatus[] = [
  "pending",
  "materials_preparation",
  "waiting_for_materials",
  "queued",
  "in_progress",
  "quality_check",
  "ready_for_installation",
];

export const fabricationStatusOptions: Array<{
  value: CustomerFabricationStatus;
  label: string;
}> = [
  { value: "not_required", label: "No Fabrication Required" },
  { value: "pending", label: "Fabrication Planning" },
  { value: "materials_preparation", label: "Preparing Materials" },
  { value: "waiting_for_materials", label: "Waiting for Materials" },
  { value: "queued", label: "Queued for Fabrication" },
  { value: "in_progress", label: "Fabrication in Progress" },
  { value: "quality_check", label: "Quality Checking" },
  { value: "on_hold", label: "Fabrication on Hold" },
  { value: "ready_for_installation", label: "Ready for Installation" },
];

export function fabricationEtaLabel(fabrication: CustomerWorkJobFabrication) {
  if (fabrication.status === "ready_for_installation") return "Fabrication completed";
  if (fabrication.status === "not_required") return "No fabrication required";
  if (fabrication.days_remaining === null) return "Completion estimate pending";
  if (fabrication.days_remaining < 0) {
    const days = Math.abs(fabrication.days_remaining);
    return `Expected date passed ${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (fabrication.days_remaining === 0) return "Expected to be done today";
  if (fabrication.days_remaining === 1) return "Expected to be done in 1 day";

  return `Expected to be done in ${fabrication.days_remaining} days`;
}

export function fabricationStageIndex(status: CustomerFabricationStatus) {
  if (status === "on_hold") return fabricationStages.indexOf("queued");

  return fabricationStages.indexOf(status);
}
