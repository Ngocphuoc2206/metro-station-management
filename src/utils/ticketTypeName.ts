export type BackendTicketName = "Daily" | "Month";

export const normalizeTicketNameForBackend = (value: string): BackendTicketName => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("month") || normalized.includes("thang")) {
    return "Month";
  }

  return "Daily";
};
