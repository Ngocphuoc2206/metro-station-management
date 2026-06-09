import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { adminDeviceApi } from "@features/adminDevice/adminDeviceApi";
import type {
  AdminDeviceRequest,
  AdminDeviceResponse,
  AdminDeviceStatus,
  AdminDeviceTypeOption,
} from "@features/adminDevice/adminDeviceTypes";
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

function getTypeName(typeId: string, typeOptions: AdminDeviceTypeOption[]) {
  return typeOptions.find((type) => type.id === typeId)?.name;
}

export default function AdminDeviceManagement() {
  const [devices, setDevices] = useState<AdminDeviceResponse[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [typeOptions, setTypeOptions] = useState<AdminDeviceTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<AdminDeviceResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      adminDeviceApi.getDevices(),
      stationApi.getAdminStations(),
      adminDeviceApi.getDeviceTypes(),
    ] as const)
      .then(([deviceResult, stationResult, deviceTypeResult]) => {
        if (cancelled) return;

        if (deviceResult.status === "fulfilled") {
          setDevices(deviceResult.value);
        }
        if (stationResult.status === "fulfilled") {
          setStations(stationResult.value);
        }
        if (deviceTypeResult.status === "fulfilled") {
          setTypeOptions(deviceTypeResult.value);
        }

        setError(deviceResult.status === "rejected" ? "Không thể tải danh sách thiết bị." : "");
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
  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return devices.filter((device) => {
      const text = `${device.deviceCode} ${device.name} ${getStationName(device, stations)} ${device.typeName ?? ""}`.toLowerCase();
      return (!query || text.includes(query))
        && (!statusFilter || device.status.toUpperCase() === statusFilter)
        && (!typeFilter || device.typeName === typeFilter);
    });
  }, [devices, search, stations, statusFilter, typeFilter]);

  const paginatedDevices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredDevices.slice(startIndex, startIndex + pageSize);
  }, [filteredDevices, currentPage]);

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
      const merged = {
        ...editingDevice,
        ...updated,
        stationId: payload.stationId,
        stationName: stationName ?? updated.stationName ?? editingDevice.stationName,
        gateId: payload.gateId,
        gateName: updated.gateName ?? editingDevice.gateName,
        typeId: payload.typeId,
        typeName: updated.typeName ?? typeName ?? editingDevice.typeName,
      };
      setDevices((current) => current.map((device) => device.id === editingDevice.id ? merged : device));
      toast.success("Đã cập nhật thiết bị.");
    } else {
      const created = await adminDeviceApi.createDevice(payload);
      const stationName = stations.find((station) => station.id === payload.stationId)?.name;
      setDevices((current) => [
        {
          ...created,
          stationId: payload.stationId,
          stationName: stationName ?? created.stationName,
          gateId: payload.gateId,
          gateName: created.gateName,
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

  const handleDelete = async (device: AdminDeviceResponse) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thiết bị "${device.name}"?`)) {
      return;
    }
    try {
      await adminDeviceApi.deleteDevice(device.id);
      setDevices((current) => current.filter((d) => d.id !== device.id));
      toast.success("Đã xóa thiết bị.");
    } catch {
      toast.error("Không thể xóa thiết bị.");
    }
  };



  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thiết bị</h1>
          <p className="mt-1 text-sm text-gray-500">Quản trị cổng, máy bán vé, máy nạp tiền và thiết bị quét.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="Tìm theo mã, tên, ga..."
          className="min-w-0 flex-1 basis-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:basis-auto"
        />
        <select
          value={typeFilter}
          onChange={(event) => {
            setTypeFilter(event.target.value);
            setCurrentPage(1);
          }}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none sm:w-auto sm:min-w-[150px]"
        >
          <option value="">Tất cả loại</option>
          {typeNames.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setCurrentPage(1);
          }}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none sm:w-auto sm:min-w-[150px]"
        >
          <option value="">Tất cả trạng thái</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{statusLabel(status)}</option>
          ))}
        </select>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Tìm kiếm
        </button>
        <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm thiết bị
        </button>
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
                <th className="px-6 py-4 text-center w-[120px]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400">Đang tải dữ liệu thiết bị...</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-red-600">{error}</td></tr>
              ) : filteredDevices.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-500">Không tìm thấy thiết bị phù hợp.</td></tr>
              ) : paginatedDevices.map((device) => (
                <tr key={device.id} className="transition hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-semibold text-blue-600">{device.deviceCode || device.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{device.name}</td>
                  <td className="px-6 py-4 text-gray-600">{device.typeName || "-"}</td>
                  <td className="px-6 py-4 text-gray-600">{getStationName(device, stations)}</td>
                  <td className="px-6 py-4 font-mono text-gray-600">{device.ipAddress || "-"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(device.status)}`}
                    >
                      {statusLabel(device.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(device)}
                        className="text-gray-400 hover:text-blue-600 transition"
                        title="Sửa"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(device)}
                        className="text-gray-400 hover:text-red-500 transition"
                        title="Xóa"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !error && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-white text-sm">
            <div className="text-gray-500">
              {filteredDevices.length === 0
                ? "Hiển thị 0 thiết bị"
                : `Hiển thị ${((currentPage - 1) * pageSize) + 1} - ${Math.min(currentPage * pageSize, filteredDevices.length)} trong tổng số ${filteredDevices.length} thiết bị`
              }
            </div>
            {filteredDevices.length > pageSize && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                  title="Trang trước"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: Math.ceil(filteredDevices.length / pageSize) }).map((_, i) => {
                  const p = i + 1;
                  const isCurrent = p === currentPage;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[32px] h-8 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-100"
                          : "text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={currentPage === Math.ceil(filteredDevices.length / pageSize)}
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredDevices.length / pageSize), p + 1))}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                  title="Trang sau"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AdminDeviceFormModal
        isOpen={isFormOpen}
        device={editingDevice}
        stations={stations}
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
