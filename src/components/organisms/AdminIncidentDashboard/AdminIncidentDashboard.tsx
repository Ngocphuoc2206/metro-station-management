/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import type { IncidentRecord } from "@features/incident/incidentTypes";

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_INCIDENTS: IncidentRecord[] = [
  {
    id: "INC-001",
    title: "Hỏng màn hình quét vé",
    stationId: "Ga Bến Thành",
    deviceId: "GATE-BT-01",
    deviceType: "gate",
    severity: "high",
    status: "Open",
    assigneeName: undefined,
    description:
      "Màn hình cảm ứng tại máy bán vé số 4 không phản hồi thao tác của người dùng, cần kiểm tra kết nối và phần cứng.",
    createdAt: "2026-06-06T01:00:00Z",
    updatedAt: "2026-06-06T01:00:00Z",
  },
  {
    id: "INC-002",
    title: "Lỗi thẻ nhớ và màn hình",
    stationId: "Ga Suối Tiên",
    deviceId: "GATE-ST-03",
    deviceType: "gate",
    severity: "medium",
    status: "Assigned",
    assigneeName: "Nguyễn Văn An",
    description: "Thẻ nhớ bị hỏng, màn hình hiển thị nhiễu.",
    createdAt: "2026-06-06T01:30:00Z",
    updatedAt: "2026-06-06T02:00:00Z",
  },
  {
    id: "INC-003",
    title: "Hỏng thẻ nhớ thiết bị",
    stationId: "Ga Tân Cảng",
    deviceId: "DEV-TC-07",
    deviceType: "device",
    severity: "low",
    status: "InProgress",
    assigneeName: "Lê Văn Tuấn",
    description: "Thẻ nhớ cần thay mới, thiết bị không khởi động được.",
    createdAt: "2026-06-06T00:00:00Z",
    updatedAt: "2026-06-06T02:10:00Z",
  },
  {
    id: "INC-004",
    title: "Hỏng màn hình tiền sảnh",
    stationId: "Ga Nhà hát TP",
    deviceId: "DISP-NH-02",
    deviceType: "display",
    severity: "critical",
    status: "InProgress",
    assigneeName: "Trần Minh",
    description: "Màn hình tắt đột ngột, không hiển thị thông tin tàu.",
    createdAt: "2026-06-05T22:00:00Z",
    updatedAt: "2026-06-06T01:55:00Z",
  },
  {
    id: "INC-005",
    title: "Lỗi quét thẻ thanh toán",
    stationId: "Ga Bình Thái",
    deviceId: "GATE-BT-09",
    deviceType: "gate",
    severity: "high",
    status: "Resolved",
    assigneeName: "Nguyễn Văn An",
    description: "Cổng quét không nhận thẻ từ, hành khách không qua được.",
    createdAt: "2026-06-05T18:00:00Z",
    updatedAt: "2026-06-06T00:30:00Z",
  },
  {
    id: "INC-006",
    title: "Hỏng máy in vé tự động",
    stationId: "Ga Bà Chiểu",
    deviceId: "PRINT-BC-01",
    deviceType: "printer",
    severity: "medium",
    status: "Resolved",
    assigneeName: "Lê Văn Tuấn",
    description: "Máy in hết giấy và bị kẹt giấy, không in được vé.",
    createdAt: "2026-06-05T16:00:00Z",
    updatedAt: "2026-06-05T20:00:00Z",
  },
  {
    id: "INC-007",
    title: "Camera an ninh offline",
    stationId: "Ga Phước Long",
    deviceId: "CAM-PL-04",
    deviceType: "camera",
    severity: "high",
    status: "Open",
    assigneeName: undefined,
    description: "Camera không kết nối được tới server ghi hình trung tâm.",
    createdAt: "2026-06-06T02:00:00Z",
    updatedAt: "2026-06-06T02:00:00Z",
  },
  {
    id: "INC-008",
    title: "Thang cuốn dừng hoạt động",
    stationId: "Ga An Phú",
    deviceId: "ESC-AP-02",
    deviceType: "elevator",
    severity: "critical",
    status: "Open",
    assigneeName: undefined,
    description:
      "Thang cuốn B2 bị kẹt cơ học, cần kỹ thuật viên kiểm tra ngay.",
    createdAt: "2026-06-06T01:45:00Z",
    updatedAt: "2026-06-06T01:45:00Z",
  },
  {
    id: "INC-009",
    title: "Lỗi hệ thống bảng giờ",
    stationId: "Ga Rạch Chiếc",
    deviceId: "SYS-RC-01",
    deviceType: "system",
    severity: "low",
    status: "Resolved",
    assigneeName: "Trần Minh",
    description: "Bảng giờ tàu hiển thị sai lệch 10 phút, cần đồng bộ lại.",
    createdAt: "2026-06-05T14:00:00Z",
    updatedAt: "2026-06-05T17:00:00Z",
  },
  {
    id: "INC-010",
    title: "Mất điện tạm thời khu vực A",
    stationId: "Ga Thủ Đức",
    deviceId: "ELEC-TD-01",
    deviceType: "electric",
    severity: "critical",
    status: "InProgress",
    assigneeName: "Nguyễn Văn An",
    description:
      "Mất điện khu A, hệ thống UPS đang hoạt động, cần khôi phục điện lưới.",
    createdAt: "2026-06-06T00:30:00Z",
    updatedAt: "2026-06-06T01:30:00Z",
  },
];

const MOCK_STAFF = [
  { id: "s1", name: "Nguyễn Văn An", email: "an@metro.com" },
  { id: "s2", name: "Lê Văn Tuấn", email: "tuan@metro.com" },
  { id: "s3", name: "Trần Minh", email: "minh@metro.com" },
  { id: "s4", name: "Phạm Thị Hoa", email: "hoa@metro.com" },
  { id: "s5", name: "Nguyễn Thị Lan", email: "lan@metro.com" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toShortCode(id: string) {
  const match = id.match(/\d+/);
  return match
    ? `SC${String(parseInt(match[0], 10)).padStart(3, "0")}`
    : id.slice(0, 6).toUpperCase();
}

// ── Badges ────────────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; cls: string; icon?: boolean }> = {
    critical: { label: "Nguy cấp", cls: "bg-red-600 text-white", icon: true },
    high: { label: "Cao", cls: "bg-red-600 text-white", icon: true },
    medium: {
      label: "Trung bình",
      cls: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    },
    low: {
      label: "Thấp",
      cls: "bg-gray-100 text-gray-600 border border-gray-200",
    },
  };
  const v = map[severity] ?? map.low;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${v.cls}`}
    >
      {v.icon && (
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 19H3L12 3l9 16z"
          />
        </svg>
      )}
      {v.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; dot: string; bg: string }> = {
    Open: {
      label: "Tạo mới",
      dot: "bg-gray-400",
      bg: "bg-gray-100 text-gray-600 border border-gray-200",
    },
    Assigned: {
      label: "Đã phân công",
      dot: "bg-blue-500",
      bg: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    InProgress: {
      label: "Đang xử lý",
      dot: "bg-orange-500",
      bg: "bg-orange-50 text-orange-700 border border-orange-200",
    },
    Escalated: {
      label: "Đang xử lý",
      dot: "bg-orange-500",
      bg: "bg-orange-50 text-orange-700 border border-orange-200",
    },
    Resolved: {
      label: "Đã hoàn thành",
      dot: "bg-green-500",
      bg: "bg-green-50 text-green-700 border border-green-200",
    },
    Closed: {
      label: "Đã đóng",
      dot: "bg-slate-500",
      bg: "bg-slate-100 text-slate-600 border border-slate-200",
    },
  };
  const v = map[status] ?? map.Open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${v.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      {v.label}
    </span>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function IncidentDetailModal({
  incident,
  onClose,
  onSaved,
}: {
  incident: IncidentRecord;
  onClose: () => void;
  onSaved: (id: string, assigneeName: string, status: string) => void;
}) {
  const shortCode = toShortCode(incident.id);
  const currentStaff = MOCK_STAFF.find((s) => s.name === incident.assigneeName);
  const [selectedStaffId, setSelectedStaffId] = useState(
    currentStaff?.id ?? "",
  );
  const [saving, setSaving] = useState(false);

  // Đọc ảnh bằng chứng từ localStorage (staff đã lưu khi hoàn thành sự cố)
  const evidenceImages: string[] = (() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("incident_evidence_v1");
      const store = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
      return store[incident.id] ?? [];
    } catch {
      return [];
    }
  })();

  const isResolved =
    incident.status === "Resolved" || incident.status === "Closed";

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500)); // simulate API
    const staff = MOCK_STAFF.find((s) => s.id === selectedStaffId);
    const newStatus = staff ? "Assigned" : incident.status;
    onSaved(incident.id, staff?.name ?? "", newStatus);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Chi tiết sự cố {shortCode}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Info grid */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Mã sự cố
              </p>
              <p className="font-bold text-blue-600">{shortCode}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Trạng thái hiện tại
              </p>
              <StatusBadge status={incident.status} />
            </div>
            <div className="col-span-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Tên sự cố
              </p>
              <p className="font-semibold text-gray-900">{incident.title}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Mô tả chi tiết
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                {incident.description || "Không có mô tả"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Mức độ
              </p>
              <SeverityBadge severity={incident.severity} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Nhà ga
              </p>
              <p className="font-semibold text-gray-900">
                {incident.stationId || "—"}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100" />
          {/* Assign staff */}
          {!isResolved && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nhân viên xử lý
              </label>
              <div className="relative">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition pr-10"
                >
                  <option value="">Chọn nhân viên...</option>
                  {MOCK_STAFF.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.email}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {selectedStaffId && (
                <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Sẽ phân công cho:{" "}
                  <span className="font-semibold">
                    {MOCK_STAFF.find((s) => s.id === selectedStaffId)?.name}
                  </span>
                </div>
              )}
            </div>
          )}{" "}
          {/* end !isResolved assign */}
          {/* Ảnh bằng chứng — đọc từ localStorage do staff lưu */}
          {isResolved && evidenceImages.length > 0 && (
            <>
              <div className="border-t border-gray-100" />
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Hình ảnh bằng chứng xử lý
                </p>
                {evidenceImages.map((src, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl overflow-hidden border border-gray-100 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Bằng chứng ${idx + 1}`}
                      className="w-full object-cover max-h-52"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          {isResolved && evidenceImages.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-dashed border-gray-200">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Nhân viên chưa tải ảnh bằng chứng hoàn thành
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition"
          >
            {isResolved ? "Đóng" : "Hủy"}
          </button>
          {!isResolved && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Lưu thay đổi
                </>
              )}
            </button>
          )}{" "}
          {/* end !isResolved save button */}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminIncidentDashboard() {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentRecord | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadIncidents();
  }, []);

  // TODO: thay bằng admin API khi BE sẵn sàng
  async function loadIncidents() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setIncidents(MOCK_INCIDENTS);
    setLoading(false);
  }

  const stats = useMemo(
    () => ({
      total: incidents.length,
      pending: incidents.filter((i) => i.status === "Open").length,
      inProgress: incidents.filter((i) =>
        ["InProgress", "Escalated", "Assigned"].includes(i.status),
      ).length,
      resolved: incidents.filter((i) =>
        ["Resolved", "Closed"].includes(i.status),
      ).length,
    }),
    [incidents],
  );

  const filtered = useMemo(() => {
    let list = incidents;
    if (statusFilter === "open") list = list.filter((i) => i.status === "Open");
    else if (statusFilter === "active")
      list = list.filter((i) =>
        ["InProgress", "Assigned", "Escalated"].includes(i.status),
      );
    else if (statusFilter === "done")
      list = list.filter((i) => ["Resolved", "Closed"].includes(i.status));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          toShortCode(i.id).toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          (i.assigneeName ?? "").toLowerCase().includes(q) ||
          (i.stationId ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [incidents, searchQuery, statusFilter]);

  // Callback khi modal lưu phân công
  const handleSaved = (id: string, assigneeName: string, status: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              assigneeName: assigneeName || inc.assigneeName,
              status: status as any,
            }
          : inc,
      ),
    );
    // Cập nhật selectedIncident nếu đang mở
    setSelectedIncident((prev) =>
      prev?.id === id
        ? {
            ...prev,
            assigneeName: assigneeName || prev.assigneeName,
            status: status as any,
          }
        : prev,
    );
  };

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
        <span>Admin</span>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-blue-600 font-semibold">Duyệt sự cố</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Duyệt sự cố
        </h1>
        <button
          onClick={loadIncidents}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Tổng sự cố",
            value: stats.total,
            colorBase: "blue",
            icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          },
          {
            label: "Mới mở",
            value: stats.pending,
            colorBase: "gray",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
          },
          {
            label: "Đang xử lý",
            value: stats.inProgress,
            colorBase: "orange",
            icon: "M13 10V3L4 14h7v7l9-11h-7z",
          },
          {
            label: "Đã xử lý",
            value: stats.resolved,
            colorBase: "green",
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm"
          >
            <div
              className={`w-10 h-10 rounded-full bg-${s.colorBase}-50 flex items-center justify-center shrink-0`}
            >
              <svg
                className={`w-5 h-5 text-${s.colorBase}-500`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {s.label}
              </div>
              <div className="text-2xl font-black text-gray-900">
                {loading ? "—" : s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mã SC, tên sự cố, nhân viên..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-gray-50 p-1">
            {[
              { value: "all", label: "Tất cả", count: incidents.length },
              { value: "open", label: "Mới mở", count: stats.pending },
              { value: "active", label: "Đang xử lý", count: stats.inProgress },
              { value: "done", label: "Đã xử lý", count: stats.resolved },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === f.value
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === f.value
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {[
                  "Mã SC",
                  "Tên sự cố",
                  "Nhà ga",
                  "Mức độ",
                  "Nhân viên",
                  "Trạng thái",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    Không tìm thấy sự cố nào
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-bold text-blue-600">
                        {toShortCode(inc.id)}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-[200px]">
                      <span className="font-semibold text-gray-900 truncate block">
                        {inc.title}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">
                      {inc.stationId || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="px-4 py-4">
                      {inc.assigneeName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                            {inc.assigneeName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-700 text-xs">
                            {inc.assigneeName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Chưa phân công
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
            Hiển thị {filtered.length} / {incidents.length} sự cố
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
