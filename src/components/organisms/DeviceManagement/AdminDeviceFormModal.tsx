import { useEffect, useMemo, useState } from "react";
import type { Station } from "@features/station/stationTypes";
import type {
  AdminDeviceRequest,
  AdminDeviceResponse,
  AdminDeviceStatus,
  DeviceDetailKind,
} from "@features/adminDevice/adminDeviceTypes";

type DeviceForm = {
  deviceCode: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  stationId: string;
  typeId: string;
  status: AdminDeviceStatus;
  lastMaintenance: string;
  detailKind: DeviceDetailKind;
  directionMode: string;
  gateType: string;
  emergencyMode: boolean;
  passageCount: string;
  cardStockLevel: string;
  acceptedPaymentMethods: string;
  cashBoxFull: boolean;
  printerInkLevel: string;
  batteryLevel: string;
  osVersion: string;
  assignedStaffId: string;
};

interface Props {
  isOpen: boolean;
  device: AdminDeviceResponse | null;
  stations: Station[];
  onClose: () => void;
  onSubmit: (payload: AdminDeviceRequest) => Promise<void>;
}

const emptyForm: DeviceForm = {
  deviceCode: "",
  name: "",
  ipAddress: "",
  macAddress: "",
  stationId: "",
  typeId: "",
  status: "ONLINE",
  lastMaintenance: "",
  detailKind: "GATE",
  directionMode: "IN",
  gateType: "",
  emergencyMode: false,
  passageCount: "0",
  cardStockLevel: "",
  acceptedPaymentMethods: "",
  cashBoxFull: false,
  printerInkLevel: "",
  batteryLevel: "",
  osVersion: "",
  assignedStaffId: "",
};

function detailValue(device: AdminDeviceResponse, key: string) {
  const value = device.additionalDetails?.[key];
  return value === undefined || value === null ? "" : String(value);
}

function boolDetail(device: AdminDeviceResponse, key: string) {
  return device.additionalDetails?.[key] === true;
}

function inferDetailKind(device: AdminDeviceResponse): DeviceDetailKind {
  const type = (device.typeName ?? "").toUpperCase();
  if (type.includes("TICKET") || type.includes("TVM")) return "TICKET_MACHINE";
  if (type.includes("SCAN")) return "SCANNER";
  return "GATE";
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

export default function AdminDeviceFormModal({
  isOpen,
  device,
  stations,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<DeviceForm>(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!device) {
      setForm(emptyForm);
      setError("");
      return;
    }
    setForm({
      ...emptyForm,
      deviceCode: device.deviceCode,
      name: device.name,
      ipAddress: device.ipAddress ?? "",
      macAddress: device.macAddress ?? "",
      stationId: device.stationId ?? "",
      typeId: device.typeId ?? "",
      status: (["ONLINE", "OFFLINE", "MAINTENANCE"].includes(device.status.toUpperCase())
        ? device.status.toUpperCase()
        : "OFFLINE") as AdminDeviceStatus,
      lastMaintenance: device.lastMaintenance?.slice(0, 16) ?? "",
      detailKind: inferDetailKind(device),
      directionMode: detailValue(device, "directionMode") || "IN",
      gateType: detailValue(device, "gateType"),
      emergencyMode: boolDetail(device, "emergencyMode"),
      passageCount: detailValue(device, "passageCount") || "0",
      cardStockLevel: detailValue(device, "cardStockLevel"),
      acceptedPaymentMethods: detailValue(device, "acceptedPaymentMethods"),
      cashBoxFull: boolDetail(device, "cashBoxFull"),
      printerInkLevel: detailValue(device, "printerInkLevel"),
      batteryLevel: detailValue(device, "batteryLevel"),
      osVersion: detailValue(device, "osVersion"),
      assignedStaffId: detailValue(device, "assignedStaffId"),
    });
    setError("");
  }, [device, isOpen]);

  const title = device ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới";
  const selectedStationName = useMemo(
    () => stations.find((station) => station.id === form.stationId)?.name,
    [form.stationId, stations],
  );

  if (!isOpen) return null;

  const set = <K extends keyof DeviceForm>(key: K, value: DeviceForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.deviceCode.trim() || !form.name.trim() || !form.stationId || !form.typeId.trim()) {
      setError("Vui lòng nhập mã, tên, ga và Type ID của thiết bị.");
      return;
    }
    const payload: AdminDeviceRequest = {
      deviceCode: form.deviceCode.trim(),
      name: form.name.trim(),
      ipAddress: form.ipAddress.trim() || undefined,
      macAddress: form.macAddress.trim() || undefined,
      stationId: form.stationId,
      typeId: form.typeId.trim(),
      status: form.status,
      lastMaintenance: form.lastMaintenance || undefined,
    };
    if (form.detailKind === "GATE") {
      payload.directionMode = form.directionMode || undefined;
      payload.gateType = form.gateType.trim() || undefined;
      payload.emergencyMode = form.emergencyMode;
      payload.passageCount = optionalNumber(form.passageCount);
    } else if (form.detailKind === "TICKET_MACHINE") {
      payload.cardStockLevel = optionalNumber(form.cardStockLevel);
      payload.acceptedPaymentMethods = form.acceptedPaymentMethods.trim() || undefined;
      payload.cashBoxFull = form.cashBoxFull;
      payload.printerInkLevel = optionalNumber(form.printerInkLevel);
    } else {
      payload.batteryLevel = optionalNumber(form.batteryLevel);
      payload.osVersion = form.osVersion.trim() || undefined;
      payload.assignedStaffId = form.assignedStaffId.trim() || undefined;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(payload);
    } catch {
      setError("Không thể lưu thiết bị. Vui lòng kiểm tra dữ liệu hoặc API backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {selectedStationName ? <p className="mt-1 text-xs text-gray-500">{selectedStationName}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Đóng">
            <span className="text-xl">&times;</span>
          </button>
        </div>
        <form id="admin-device-form" onSubmit={submit} className="overflow-y-auto px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Thông tin thiết bị</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Mã thiết bị *" value={form.deviceCode} onChange={(value) => set("deviceCode", value)} placeholder="GATE-BT-01" />
            <Field label="Tên thiết bị *" value={form.name} onChange={(value) => set("name", value)} placeholder="Cổng vào số 01" />
            <label className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Trạng thái</span>
              <select value={form.status} onChange={(event) => set("status", event.target.value as AdminDeviceStatus)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none">
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Ga *</span>
              <select value={form.stationId} onChange={(event) => set("stationId", event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none">
                <option value="">Chọn ga</option>
                {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
              </select>
            </label>
            <Field label="Type ID *" value={form.typeId} onChange={(value) => set("typeId", value)} placeholder="UUID loại thiết bị" />
            <Field label="IP Address" value={form.ipAddress} onChange={(value) => set("ipAddress", value)} placeholder="192.168.1.10" />
            <Field label="MAC Address" value={form.macAddress} onChange={(value) => set("macAddress", value)} placeholder="00:1A:2B:3C:4D:5E" />
            <label className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Bảo trì gần nhất</span>
              <input type="datetime-local" value={form.lastMaintenance} onChange={(event) => set("lastMaintenance", event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
            </label>
          </div>

          <div className="my-6 border-t border-gray-100" />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Thông tin chi tiết theo loại</p>
            <select value={form.detailKind} onChange={(event) => set("detailKind", event.target.value as DeviceDetailKind)} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none">
              <option value="GATE">Gate</option>
              <option value="TICKET_MACHINE">Ticket machine</option>
              <option value="SCANNER">Scanner</option>
            </select>
          </div>
          {form.detailKind === "GATE" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Field label="Direction mode" value={form.directionMode} onChange={(value) => set("directionMode", value)} placeholder="IN / OUT / BI" />
              <Field label="Gate type" value={form.gateType} onChange={(value) => set("gateType", value)} placeholder="STANDARD" />
              <Field label="Passage count" value={form.passageCount} onChange={(value) => set("passageCount", value)} type="number" />
              <Checkbox label="Emergency mode" checked={form.emergencyMode} onChange={(value) => set("emergencyMode", value)} />
            </div>
          ) : form.detailKind === "TICKET_MACHINE" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Field label="Card stock level" value={form.cardStockLevel} onChange={(value) => set("cardStockLevel", value)} type="number" />
              <Field label="Payment methods" value={form.acceptedPaymentMethods} onChange={(value) => set("acceptedPaymentMethods", value)} placeholder="CASH,CARD,QR" />
              <Field label="Printer ink level" value={form.printerInkLevel} onChange={(value) => set("printerInkLevel", value)} type="number" />
              <Checkbox label="Cash box full" checked={form.cashBoxFull} onChange={(value) => set("cashBoxFull", value)} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Battery level" value={form.batteryLevel} onChange={(value) => set("batteryLevel", value)} type="number" />
              <Field label="OS Version" value={form.osVersion} onChange={(value) => set("osVersion", value)} placeholder="Android 14" />
              <Field label="Assigned staff ID" value={form.assignedStaffId} onChange={(value) => set("assignedStaffId", value)} placeholder="UUID nhân viên" />
            </div>
          )}
          {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p> : null}
        </form>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Hủy</button>
          <button type="submit" form="admin-device-form" disabled={isSubmitting} className="min-w-32 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? "Đang lưu..." : device ? "Lưu thay đổi" : "Thêm thiết bị"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-blue-600" />
      {label}
    </label>
  );
}
