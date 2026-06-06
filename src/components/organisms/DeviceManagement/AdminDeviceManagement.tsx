import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { adminDeviceApi } from "@features/adminDevice/adminDeviceApi";
import type {
  AdminDeviceRequest,
  AdminDeviceResponse,
  AdminDeviceStatus,
  AdminDeviceTypeOption,
} from "@features/adminDevice/adminDeviceTypes";
import { staffGateApi } from "@features/staffGate/staffGateApi";
import type { GateResponse } from "@features/staffGate/staffGateTypes";
import { stationApi } from "@features/station/stationApi";
import type { Station } from "@features/station/stationTypes";
import AdminDeviceFormModal from "./AdminDeviceFormModal";

const statuses: AdminDeviceStatus[] = ["ACTIVE", "INACTIVE", "ERROR", "MAINTENANCE"];

function statusLabel(status: AdminDeviceStatus | string) {
  const value = status.toUpperCase();
  if (value === "ACTIVE") return "Hoạt động";
  if (value === "INACTIVE") return "Ngừng hoạt động";
  if (value === "ERROR") return "Lỗi";
  if (value === "MAINTENANCE") return "Bảo trì";
  return status;
}

function statusClass(status: string) {
  const value = status.toUpperCase();
  if (value === "ACTIVE") return "bg-green-50 text-green-700 border-green-200";
  if (value === "ERROR") return "bg-red-50 text-red-700 border-red-200";
  if (value === "MAINTENANCE") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function getStationName(device: AdminDeviceResponse, stations: Station[]) {
  return stations.find((station) => station.id === device.stationId)?.name
    ?? device.stationName
    ?? "-";
}

function getTypeOptions(devices: AdminDeviceResponse[]): AdminDeviceTypeOption[] {
  const options = new Map<string, string>();
  devices.forEach((device) => {
    if (device.typeId && device.typeName) {
      options.set(device.typeId, device.typeName);
    }
  });
  return [...options.entries()].map(([id, name]) => ({ id, name }));
}

function getTypeName(typeId: string, typeOptions: AdminDeviceTypeOption[]) {
  return typeOptions.find((type) => type.id === typeId)?.name;
}

export default function AdminDeviceManagement() {
  const [devices, setDevices] = useState<AdminDeviceResponse[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [gates, setGates] = useState<GateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<AdminDeviceResponse | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminDeviceApi.getDevices(),
      stationApi.getStations({}, 1, 500).then((result) => result.data),
      staffGateApi.getGates().catch(() => []),
    ])
      .then(([deviceData, stationData, gateData]) => {
        if (cancelled) return;
        setDevices(deviceData);
        setStations(stationData);
        setGates(gateData);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải danh sách thiết bị.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const typeNames = useMemo(
    () => [...new Set(devices.map((device) => device.typeName).filter(Boolean) as string[])],
    [devices],
  );
  const typeOptions = useMemo(() => getTypeOptions(devices), [devices]);

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return devices.filter((device) => {
      const text = `${device.deviceCode} ${device.name} ${getStationName(device, stations)} ${device.typeName ?? ""}`.toLowerCase();
      return (!query || text.includes(query))
        && (!statusFilter || device.status.toUpperCase() === statusFilter)
        && (!typeFilter || device.typeName === typeFilter);
    });
  }, [devices, search, stations, statusFilter, typeFilter]);

  const openCreate = () => {
    setEditingDevice(null);
    setIsFormOpen(true);
  };

  const openEdit = (device: AdminDeviceResponse) => {
    setEditingDevice(device);
    setIsFormOpen(true);
  };

  const submit = async (payload: AdminDeviceRequest) => {
    const typeName = getTypeName(payload.typeId, typeOptions);
    if (editingDevice) {
      const updated = await adminDeviceApi.updateDevice(editingDevice.id, payload);
      const stationName = stations.find((station) => station.id === payload.stationId)?.name;
      const gateName = gates.find((gate) => gate.gateId === payload.gateId)?.name;
      const merged = {
        ...editingDevice,
        ...updated,
        stationId: payload.stationId,
        stationName: stationName ?? updated.stationName ?? editingDevice.stationName,
        gateId: payload.gateId,
        gateName: gateName ?? updated.gateName ?? editingDevice.gateName,
        typeId: payload.typeId,
        typeName: updated.typeName ?? typeName ?? editingDevice.typeName,
      };
      setDevices((current) => current.map((device) => device.id === editingDevice.id ? merged : device));
      toast.success("Đã cập nhật thiết bị.");
    } else {
      const created = await adminDeviceApi.createDevice(payload);
      const stationName = stations.find((station) => station.id === payload.stationId)?.name;
      const gateName = gates.find((gate) => gate.gateId === payload.gateId)?.name;
      setDevices((current) => [
        {
          ...created,
          stationId: payload.stationId,
          stationName: stationName ?? created.stationName,
          gateId: payload.gateId,
          gateName: gateName ?? created.gateName,
          typeId: payload.typeId,
          typeName: created.typeName ?? typeName,
        },
        ...current,
      ]);
      toast.success("Đã thêm thiết bị.");
    }
    setIsFormOpen(false);
    setEditingDevice(null);
  };

  const changeStatus = async (device: AdminDeviceResponse, status: AdminDeviceStatus) => {
    setChangingStatusId(device.id);
    try {
      const updated = await adminDeviceApi.updateStatus(device.id, status);
      setDevices((current) => current.map((item) => item.id === device.id ? { ...item, ...updated, status } : item));
      toast.success("Đã cập nhật trạng thái thiết bị.");
    } catch {
      toast.error("Không thể cập nhật trạng thái thiết bị.");
    } finally {
      setChangingStatusId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thiết bị</h1>
          <p className="mt-1 text-sm text-gray-500">Quản trị cổng, máy bán vé, máy nạp tiền và thiết bị quét.</p>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
          <span className="text-lg leading-none">+</span>
          Thêm thiết bị
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo mã, tên, ga..."
          className="min-w-[260px] flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="min-w-[170px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none">
          <option value="">Tất cả loại</option>
          {typeNames.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-w-[170px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none">
          <option value="">Tất cả trạng thái</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="app-table-shell min-h-[420px]">
        <div className="app-table-scroll">
          <table className="app-table text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium tracking-wider text-gray-400">
                <th className="px-6 py-4">MÃ THIẾT BỊ</th>
                <th className="px-6 py-4">TÊN THIẾT BỊ</th>
                <th className="px-6 py-4">LOẠI</th>
                <th className="px-6 py-4">GA</th>
                <th className="px-6 py-4">IP ADDRESS</th>
                <th className="px-6 py-4">TRẠNG THÁI</th>
                <th className="px-6 py-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400">Đang tải dữ liệu thiết bị...</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-red-600">{error}</td></tr>
              ) : filteredDevices.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-500">Không tìm thấy thiết bị phù hợp.</td></tr>
              ) : filteredDevices.map((device) => (
                <tr key={device.id} className="transition hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-semibold text-blue-600">{device.deviceCode || device.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{device.name}</td>
                  <td className="px-6 py-4 text-gray-600">{device.typeName || "-"}</td>
                  <td className="px-6 py-4 text-gray-600">{getStationName(device, stations)}</td>
                  <td className="px-6 py-4 font-mono text-gray-600">{device.ipAddress || "-"}</td>
                  <td className="px-6 py-4">
                    <select
                      value={statuses.includes(device.status.toUpperCase() as AdminDeviceStatus) ? device.status.toUpperCase() : "INACTIVE"}
                      disabled={changingStatusId === device.id}
                      onChange={(event) => changeStatus(device, event.target.value as AdminDeviceStatus)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium focus:outline-none ${statusClass(device.status)}`}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" onClick={() => openEdit(device)} className="text-sm font-medium text-blue-600 hover:text-blue-700">Chỉnh sửa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !error ? (
          <div className="app-table-summary">
            Hiển thị {filteredDevices.length} trong {devices.length} thiết bị
          </div>
        ) : null}
      </div>

      <AdminDeviceFormModal
        isOpen={isFormOpen}
        device={editingDevice}
        stations={stations}
        gates={gates}
        typeOptions={typeOptions}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDevice(null);
        }}
        onSubmit={submit}
      />
    </div>
  );
}
