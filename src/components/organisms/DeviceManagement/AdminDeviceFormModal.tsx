import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { adminDeviceApi } from "@features/adminDevice/adminDeviceApi";
import { getMyProfile } from "@features/user/userApi";
import type { GateResponse } from "@features/staffGate/staffGateTypes";
import type { Station } from "@features/station/stationTypes";
import type {
  AdminDeviceRequest,
  AdminDeviceResponse,
  AdminDeviceStatus,
  AdminDeviceTypeOption,
  DeviceDetailKind,
} from "@features/adminDevice/adminDeviceTypes";

type DeviceForm = {
  deviceCode: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  stationId: string;
  gateId: string;
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
  readerFirmwareVersion: string;
  maxTopupLimit: string;
  batteryLevel: string;
  osVersion: string;
  assignedStaffId: string;
};

interface Props {
  isOpen: boolean;
  device: AdminDeviceResponse | null;
  stations: Station[];
  typeOptions: AdminDeviceTypeOption[];
  onClose: () => void;
  onSubmit: (payload: AdminDeviceRequest) => Promise<void>;
}

const emptyForm: DeviceForm = {
  deviceCode: "",
  name: "",
  ipAddress: "",
  macAddress: "",
  stationId: "",
  gateId: "",
  typeId: "",
  status: "ACTIVE",
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
  readerFirmwareVersion: "",
  maxTopupLimit: "",
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

function inferDetailKindFromName(typeName?: string): DeviceDetailKind {
  const type = (typeName ?? "").toUpperCase();
  if (type.includes("TOPUP") || type.includes("NẠP") || type.includes("NAP")) return "TOPUP_MACHINE";
  if (type.includes("TICKET") || type.includes("TVM")) return "TICKET_MACHINE";
  if (type.includes("SCAN")) return "SCANNER";
  return "GATE";
}

function inferDetailKind(device: AdminDeviceResponse): DeviceDetailKind {
  return inferDetailKindFromName(device.typeName);
}

function formatDateTimeLocal(value?: string) {
  return value ? value.slice(0, 16) : "";
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

function statusLabel(status: AdminDeviceStatus) {
  if (status === "ACTIVE") return "Hoạt động";
  if (status === "INACTIVE") return "Ngừng hoạt động";
  if (status === "ERROR") return "Lỗi";
  return "Bảo trì";
}

function requestErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }
    if (error.response?.status) {
      return `Backend trả về HTTP ${error.response.status}.`;
    }
  }
  return "Không thể lưu thiết bị. Vui lòng kiểm tra dữ liệu hoặc API backend.";
}

export default function AdminDeviceFormModal({
  isOpen,
  device,
  stations,
  typeOptions,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<DeviceForm>(emptyForm);
  const [gates, setGates] = useState<GateResponse[]>([]);
  const [isLoadingGates, setIsLoadingGates] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState("");
  const [isLoadingStaffId, setIsLoadingStaffId] = useState(false);

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
      gateId: device.gateId ?? "",
      typeId: device.typeId ?? "",
      status: (["ACTIVE", "INACTIVE", "ERROR", "MAINTENANCE"].includes(device.status.toUpperCase())
        ? device.status.toUpperCase()
        : "INACTIVE") as AdminDeviceStatus,
      lastMaintenance: formatDateTimeLocal(device.lastMaintenance),
      detailKind: inferDetailKind(device),
      directionMode: detailValue(device, "directionMode") || "IN",
      gateType: detailValue(device, "gateType"),
      emergencyMode: boolDetail(device, "emergencyMode"),
      passageCount: detailValue(device, "passageCount") || "0",
      cardStockLevel: detailValue(device, "cardStockLevel"),
      acceptedPaymentMethods: detailValue(device, "acceptedPaymentMethods"),
      cashBoxFull: boolDetail(device, "cashBoxFull"),
      printerInkLevel: detailValue(device, "printerInkLevel"),
      readerFirmwareVersion: detailValue(device, "readerFirmwareVersion"),
      maxTopupLimit: detailValue(device, "maxTopupLimit"),
      batteryLevel: detailValue(device, "batteryLevel"),
      osVersion: detailValue(device, "osVersion"),
      assignedStaffId: detailValue(device, "assignedStaffId"),
    });
    setError("");
  }, [device, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setCurrentStaffId("");
    setIsLoadingStaffId(true);
    getMyProfile()
      .then((profile) => {
        if (!cancelled) setCurrentStaffId(profile?.userId ?? "");
      })
      .catch(() => {
        if (!cancelled) setCurrentStaffId("");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStaffId(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || form.detailKind !== "SCANNER" || !currentStaffId) return;
    setForm((current) => {
      if (current.detailKind !== "SCANNER" || current.assignedStaffId.trim()) {
        return current;
      }
      return { ...current, assignedStaffId: currentStaffId };
    });
  }, [currentStaffId, form.detailKind, isOpen]);

  useEffect(() => {
    if (!isOpen || !form.stationId) {
      setGates([]);
      setIsLoadingGates(false);
      return;
    }

    let cancelled = false;
    setGates([]);
    setIsLoadingGates(true);
    adminDeviceApi.getGatesByStation(form.stationId)
      .then((data) => {
        if (!cancelled) setGates(data);
      })
      .catch(() => {
        if (!cancelled) setGates([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingGates(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.stationId, isOpen]);

  const title = device ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới";
  const selectedStationName = useMemo(
    () => stations.find((station) => station.id === form.stationId)?.name,
    [form.stationId, stations],
  );
  const formTypeOptions = useMemo(() => {
    if (!device?.typeId || !device.typeName || typeOptions.some((type) => type.id === device.typeId)) {
      return typeOptions;
    }
    return [...typeOptions, { id: device.typeId, name: device.typeName }];
  }, [device?.typeId, device?.typeName, typeOptions]);
  const selectedTypeName = useMemo(
    () => formTypeOptions.find((type) => type.id === form.typeId)?.name ?? "",
    [form.typeId, formTypeOptions],
  );
  const filteredGates = useMemo(
    () => {
      const stationGates = gates.filter((gate) => !gate.stationId || gate.stationId === form.stationId);
      if (!device?.gateId || stationGates.some((gate) => gate.gateId === device.gateId)) {
        return stationGates;
      }
      return [
        ...stationGates,
        {
          gateId: device.gateId,
          gateCode: device.gateName ?? device.gateId,
          name: device.gateName ?? device.gateId,
          stationId: device.stationId ?? "",
          stationName: device.stationName ?? "",
          action: "",
          status: "",
        },
      ];
    },
    [device, form.stationId, gates],
  );

  if (!isOpen) return null;

  const set = <K extends keyof DeviceForm>(key: K, value: DeviceForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setTypeId = (typeId: string) => {
    const typeName = formTypeOptions.find((type) => type.id === typeId)?.name;
    const detailKind = inferDetailKindFromName(typeName);
    setForm((current) => ({
      ...current,
      typeId,
      detailKind,
      assignedStaffId:
        detailKind === "SCANNER" && !current.assignedStaffId.trim()
          ? currentStaffId
          : current.assignedStaffId,
    }));
  };

  const setStationId = (stationId: string) => {
    setForm((current) => ({ ...current, stationId, gateId: "" }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.deviceCode.trim() || !form.name.trim() || !form.stationId || !form.typeId.trim()) {
      setError("Vui lòng nhập mã, tên, ga và loại thiết bị.");
      return;
    }
    if (form.detailKind === "GATE" && (!form.directionMode || !form.gateType.trim())) {
      setError("Thiết bị Gate cần Direction mode và Gate type.");
      return;
    }
    const passageCount = optionalNumber(form.passageCount);
    if (form.detailKind === "GATE" && (passageCount === undefined || !Number.isInteger(passageCount) || passageCount < 0)) {
      setError("Passage count phải là số nguyên không âm.");
      return;
    }
    const payload: AdminDeviceRequest = {
      deviceCode: form.deviceCode.trim(),
      name: form.name.trim(),
      ipAddress: form.ipAddress.trim() || undefined,
      macAddress: form.macAddress.trim() || undefined,
      status: form.status,
      stationId: form.stationId,
      gateId: form.gateId || undefined,
      typeId: form.typeId.trim(),
      lastMaintenance: form.lastMaintenance || undefined,
    };
    if (form.detailKind === "GATE") {
      payload.directionMode = form.directionMode;
      payload.gateType = form.gateType.trim();
      payload.emergencyMode = form.emergencyMode;
      payload.passageCount = passageCount;
    } else if (form.detailKind === "TICKET_MACHINE") {
      payload.cardStockLevel = optionalNumber(form.cardStockLevel);
      payload.acceptedPaymentMethods = form.acceptedPaymentMethods.trim() || undefined;
      payload.cashBoxFull = form.cashBoxFull;
      payload.printerInkLevel = optionalNumber(form.printerInkLevel);
    } else if (form.detailKind === "TOPUP_MACHINE") {
      payload.readerFirmwareVersion = form.readerFirmwareVersion.trim() || undefined;
      payload.maxTopupLimit = optionalNumber(form.maxTopupLimit);
    } else {
      payload.batteryLevel = optionalNumber(form.batteryLevel);
      payload.osVersion = form.osVersion.trim() || undefined;
      payload.assignedStaffId = form.assignedStaffId.trim() || undefined;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(requestErrorMessage(submitError));
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
                <option value="ACTIVE">{statusLabel("ACTIVE")}</option>
                <option value="INACTIVE">{statusLabel("INACTIVE")}</option>
                <option value="ERROR">{statusLabel("ERROR")}</option>
                <option value="MAINTENANCE">{statusLabel("MAINTENANCE")}</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Ga *</span>
              <select value={form.stationId} onChange={(event) => setStationId(event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none">
                <option value="">Chọn ga</option>
                {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Loại thiết bị *</span>
              <select value={form.typeId} onChange={(event) => setTypeId(event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none">
                <option value="">Chọn loại thiết bị</option>
                {formTypeOptions.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Cổng</span>
              <select
                value={form.gateId}
                disabled={!form.stationId || isLoadingGates}
                onChange={(event) => set("gateId", event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {!form.stationId ? "Chọn ga trước" : isLoadingGates ? "Đang tải cổng..." : "Không gắn cổng"}
                </option>
                {filteredGates.map((gate) => (
                  <option key={gate.gateId} value={gate.gateId}>
                    {gate.name || gate.gateCode || gate.gateId}
                  </option>
                ))}
              </select>
            </label>
            <Field label="IP Address" value={form.ipAddress} onChange={(value) => set("ipAddress", value)} placeholder="192.168.1.10" />
            <Field label="MAC Address" value={form.macAddress} onChange={(value) => set("macAddress", value)} placeholder="00:1A:2B:3C:4D:5E" />
            <Field label="Last maintenance" value={form.lastMaintenance} onChange={(value) => set("lastMaintenance", value)} type="datetime-local" />
          </div>

          <div className="my-6 border-t border-gray-100" />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Thông tin chi tiết theo loại</p>
            {selectedTypeName ? (
              <span className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
                {selectedTypeName}
              </span>
            ) : null}
          </div>
          {form.detailKind === "GATE" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <label className="space-y-1.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Direction mode *</span>
                <select value={form.directionMode} onChange={(event) => set("directionMode", event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none">
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                  <option value="BI">BI</option>
                </select>
              </label>
              <Field label="Gate type *" value={form.gateType} onChange={(value) => set("gateType", value)} placeholder="Swing Gate" />
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
          ) : form.detailKind === "TOPUP_MACHINE" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Reader firmware version" value={form.readerFirmwareVersion} onChange={(value) => set("readerFirmwareVersion", value)} placeholder="FW-1.0.0" />
              <Field label="Max topup limit" value={form.maxTopupLimit} onChange={(value) => set("maxTopupLimit", value)} type="number" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Battery level" value={form.batteryLevel} onChange={(value) => set("batteryLevel", value)} type="number" />
              <Field label="OS Version" value={form.osVersion} onChange={(value) => set("osVersion", value)} placeholder="Android 14" />
              <Field label="Assigned staff ID" value={form.assignedStaffId} onChange={(value) => set("assignedStaffId", value)} placeholder={isLoadingStaffId ? "Đang lấy ID nhân viên..." : "UUID nhân viên"} />
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
  type?: "text" | "number" | "datetime-local";
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
