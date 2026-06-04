export type Lang = "vi" | "en";

const enToViEntries: Array<[string, string]> = [
  ["All rights reserved.", "Bảo lưu mọi quyền."],
  ["Main navigation", "Điều hướng chính"],
  ["Staff Portal", "Cổng nhân viên"],
  ["Station Master", "Trưởng ga"],
  ["Admin User", "Người dùng quản trị"],
  ["Passenger avatar", "Ảnh đại diện hành khách"],
  ["Notifications", "Thông báo"],
  ["SYSTEM NORMAL", "HỆ THỐNG ỔN ĐỊNH"],
  ["Ticket ref", "Mã vé"],
  ["Ticket Ref", "Mã vé"],
  ["Ticket code", "Mã vé"],
  ["Mock Mode", "Chế độ mô phỏng"],
  ["Dashboard", "Bảng điều khiển"],
  ["Live map", "Bản đồ trực tuyến"],
  ["Search stations, tickets, schedules...", "Tìm kiếm ga, vé, lịch trình..."],
  ["Search transactions, ticket code...", "Tìm kiếm giao dịch, mã vé..."],
  ["Home", "Trang chủ"],
  ["Sign in", "\u0110\u0103ng nh\u1eadp"],
  ["Login", "\u0110\u0103ng nh\u1eadp"],
  ["Log in", "\u0110\u0103ng nh\u1eadp"],
  ["Sign up", "\u0110\u0103ng k\u00fd"],
  ["Signup", "\u0110\u0103ng k\u00fd"],
  ["Register", "\u0110\u0103ng k\u00fd"],
  ["Logout", "\u0110\u0103ng xu\u1ea5t"],
  ["Log out", "\u0110\u0103ng xu\u1ea5t"],
  ["Email", "Email"],
  ["Password", "M\u1eadt kh\u1ea9u"],
  ["Confirm Password", "X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u"],
  ["Forgot password", "Qu\u00ean m\u1eadt kh\u1ea9u"],
  ["Remember me", "Ghi nh\u1edb \u0111\u0103ng nh\u1eadp"],
  ["Admin", "Qu\u1ea3n tr\u1ecb"],
  ["Staff", "Nh\u00e2n vi\u00ean"],
  ["Passenger", "H\u00e0nh kh\u00e1ch"],
  ["Profile", "H\u1ed3 s\u01a1"],
  ["Account", "T\u00e0i kho\u1ea3n"],
  ["Settings", "C\u00e0i \u0111\u1eb7t"],
  ["Language", "Ng\u00f4n ng\u1eef"],
  ["English", "Ti\u1ebfng Anh"],
  ["Vietnamese", "Ti\u1ebfng Vi\u1ec7t"],
  ["Users", "Ng\u01b0\u1eddi d\u00f9ng"],
  ["Roles", "Vai tr\u00f2"],
  ["Permissions", "Ph\u00e2n quy\u1ec1n"],
  ["Devices", "Thi\u1ebft b\u1ecb"],
  ["Routes", "Tuy\u1ebfn"],
  ["Stations", "Ga"],
  ["Schedules", "L\u1ecbch tr\u00ecnh"],
  ["Reports", "B\u00e1o c\u00e1o"],
  ["Audit Logs", "Nh\u1eadt k\u00fd ki\u1ec3m to\u00e1n"],
  ["Ticket Types", "Lo\u1ea1i v\u00e9"],
  ["Tickets", "V\u00e9"],
  ["Ticket", "V\u00e9"],
  ["Fare", "Gi\u00e1 v\u00e9"],
  ["Payment", "Thanh to\u00e1n"],
  ["Transaction", "Giao d\u1ecbch"],
  ["Transactions", "Giao d\u1ecbch"],
  ["Shift", "Ca tr\u1ef1c"],
  ["Incidents", "S\u1ef1 c\u1ed1"],
  ["Incident", "S\u1ef1 c\u1ed1"],
  ["Gate", "C\u1ed5ng"],
  ["Scanner", "M\u00e1y qu\u00e9t"],
  ["Live map", "B\u1ea3n \u0111\u1ed3 th\u1eddi gian th\u1ef1c"],
  ["History", "L\u1ecbch s\u1eed"],
  ["Recent", "G\u1ea7n \u0111\u00e2y"],
  ["Success", "Th\u00e0nh c\u00f4ng"],
  ["Failed", "Th\u1ea5t b\u1ea1i"],
  ["Pending", "\u0110ang ch\u1edd"],
  ["Resolved", "\u0110\u00e3 x\u1eed l\u00fd"],
  ["Open", "\u0110ang m\u1edf"],
  ["Closed", "\u0110\u00e3 \u0111\u00f3ng"],
  ["Online", "Tr\u1ef1c tuy\u1ebfn"],
  ["Offline", "Ngo\u1ea1i tuy\u1ebfn"],
  ["Status", "Tr\u1ea1ng th\u00e1i"],
  ["Active", "Ho\u1ea1t \u0111\u1ed9ng"],
  ["Inactive", "Ng\u1eebng ho\u1ea1t \u0111\u1ed9ng"],
  ["Name", "T\u00ean"],
  ["Code", "M\u00e3"],
  ["Type", "Lo\u1ea1i"],
  ["Description", "M\u00f4 t\u1ea3"],
  ["Date", "Ng\u00e0y"],
  ["Time", "Th\u1eddi gian"],
  ["Start", "B\u1eaft \u0111\u1ea7u"],
  ["End", "K\u1ebft th\u00fac"],
  ["From", "T\u1eeb"],
  ["To", "\u0110\u1ebfn"],
  ["Direction", "H\u01b0\u1edbng"],
  ["Search", "T\u00ecm ki\u1ebfm"],
  ["Filter", "L\u1ecdc"],
  ["Sort", "S\u1eafp x\u1ebfp"],
  ["All", "T\u1ea5t c\u1ea3"],
  ["Refresh", "L\u00e0m m\u1edbi"],
  ["Loading", "\u0110ang t\u1ea3i"],
  ["No data", "Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u"],
  ["Empty", "Tr\u1ed1ng"],
  ["View", "Xem"],
  ["Details", "Chi ti\u1ebft"],
  ["Create", "T\u1ea1o"],
  ["Add", "Th\u00eam"],
  ["Edit", "S\u1eeda"],
  ["Update", "C\u1eadp nh\u1eadt"],
  ["Delete", "X\u00f3a"],
  ["Save", "L\u01b0u"],
  ["Cancel", "H\u1ee7y"],
  ["Close", "\u0110\u00f3ng"],
  ["Back", "Quay l\u1ea1i"],
  ["Next", "Ti\u1ebfp theo"],
  ["Previous", "Tr\u01b0\u1edbc \u0111\u00f3"],
  ["Continue", "Ti\u1ebfp t\u1ee5c"],
  ["Submit", "G\u1eedi"],
  ["Confirm", "X\u00e1c nh\u1eadn"],
  ["Retry", "Th\u1eed l\u1ea1i"],
];

const viToEnEntries: Array<[string, string]> = enToViEntries.map(([en, vi]) => [vi, en]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dictionaryPattern(value: string) {
  const escaped = escapeRegex(value);
  const shouldMatchWholeToken = /^[\p{L}\p{N}\s]+$/u.test(value);

  if (!shouldMatchWholeToken) {
    return new RegExp(escaped, "giu");
  }

  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu");
}

function replaceWithDictionary(input: string, entries: Array<[string, string]>) {
  let output = input;
  const sorted = [...entries].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    const pattern = dictionaryPattern(from);
    output = output.replace(pattern, to);
  }
  return output;
}

export function translateUiText(value: string, lang: Lang): string {
  if (!value) return value;
  const normalizedBrand = value.replace(/MetroTiếp theo|MetroNext/gi, "Metro");
  if (lang === "vi") return replaceWithDictionary(normalizedBrand, enToViEntries);
  return replaceWithDictionary(normalizedBrand, viToEnEntries);
}
