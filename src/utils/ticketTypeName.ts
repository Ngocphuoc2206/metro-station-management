export type BackendTicketName = "Daily" | "Month" | "Single";

const normalizeTicketTypeText = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

export const matchBackendTicketName = (
  value?: string,
): BackendTicketName | null => {
  if (!value) return null;

  const normalized = normalizeTicketTypeText(value);

  if (
    normalized.includes("single") ||
    normalized.includes("one-way") ||
    normalized.includes("one way") ||
    normalized.includes("luot")
  ) {
    return "Single";
  }

  if (
    normalized.includes("month") ||
    normalized.includes("monthly") ||
    normalized.includes("thang")
  ) {
    return "Month";
  }

  if (
    normalized.includes("daily") ||
    normalized.includes("day") ||
    normalized.includes("ngay")
  ) {
    return "Daily";
  }

  return null;
};

export const normalizeTicketNameForBackend = (value: string): string => {
  const matchedName = matchBackendTicketName(value);
  if (matchedName) return matchedName;

  return value.trim();
};

export const displayTicketTypeName = (
  ticketTypeName?: string,
  fallback = "Vé lượt",
) => {
  const rawName = (ticketTypeName ?? "").trim();
  const matchedName = matchBackendTicketName(rawName);

  if (matchedName === "Daily") return "Vé ngày";
  if (matchedName === "Month") return "Vé tháng";
  if (matchedName === "Single") return "Vé lượt";

  return rawName || fallback;
};
