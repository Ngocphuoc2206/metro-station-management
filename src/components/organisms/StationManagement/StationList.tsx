import { useState, useEffect } from "react";
import { stationApi } from "@features/station/stationApi";
import { Station, StationFilters } from "@features/station/stationTypes";
import StationFormModal from "./StationFormModal";
import DeactivateConfirmModal from "./DeactivateConfirmModal";

export default function StationList() {
  const [stations, setStations] = useState<Station[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagi
  const [search, setSearch] = useState("");
  const [debounceSearch, setDebounceSearch] = useState("");
  const [filterLine, setFilterLine] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetStation, setTargetStation] = useState<Station | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebounceSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  const loadData = async () => {
    setLoading(true);
    try {
      const filters: StationFilters = {
        search: debounceSearch,
        line: filterLine,
        status: filterStatus,
      };
      const res = await stationApi.getStations(filters, page, limit);
      setStations(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to load stations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceSearch, filterLine, filterStatus, page]);

  // Actions
  const handleCreate = () => {
    setEditingStation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (station: Station) => {
    setEditingStation(station);
    setIsFormOpen(true);
  };

  const handleToggleClick = (station: Station) => {
    setTargetStation(station);
    setIsConfirmOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = async (data: any) => {
    if (editingStation) {
      await stationApi.updateStation(editingStation.id, data);
    } else {
      await stationApi.createStation(data);
    }
    setIsFormOpen(false);
    loadData(); // reload
  };

  const handletoggleConfirm = async () => {
    if (!targetStation) return;
    const newStatus = targetStation.status === "active" ? "inactive" : "active";
    await stationApi.toggleStatus(targetStation, newStatus);
    setIsConfirmOpen(false);
    loadData(); // update grid
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nhà ga</h1>
        <button
          onClick={handleCreate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Thêm ga
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm nhà ga, mã ga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>

        <select
          value={filterLine}
          onChange={(e) => {
            setFilterLine(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto sm:min-w-[150px]"
        >
          <option value="">Tất cả tuyến</option>
          <option value="L1">Tuyến 1</option>
          <option value="L2">Tuyến 2</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto sm:min-w-[150px]"
        >
          <option value="">Trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Tạm ngưng</option>
        </select>
      </div>

      {/* Table */}
      <div className="app-table-shell relative flex min-h-[400px] flex-col">
        <div className="app-table-scroll">
          <table className="app-table text-left text-sm">
            <thead>
              <tr className="border-b border-gray-50 text-gray-400">
                <th className="px-6 py-4 font-medium tracking-wider text-xs">
                  MÃ
                </th>
                <th className="px-6 py-4 font-medium tracking-wider text-xs">
                  TÊN GA
                </th>
                <th className="px-6 py-4 font-medium tracking-wider text-xs">
                  TUYẾN
                </th>
                <th className="px-6 py-4 font-medium tracking-wider text-xs">
                  KHU VỰC / QUẬN
                </th>
                <th className="px-6 py-4 font-medium tracking-wider text-xs">
                  TRẠNG THÁI
                </th>
                <th className="px-6 py-4 font-medium tracking-wider text-xs text-right">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && stations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <svg
                      className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Không tìm thấy nhà ga nào phù hợp.
                  </td>
                </tr>
              ) : (
                stations.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-blue-600">
                      {s.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold">
                        {s.line}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{s.zone}</td>
                    <td className="px-6 py-4">
                      {s.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Tạm ngưng
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-gray-400 hover:text-blue-600 transition"
                          title="Sửa"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleClick(s)}
                          className={`transition ${s.status === "active" ? "text-gray-400 hover:text-red-600" : "text-gray-400 hover:text-green-600"}`}
                          title={
                            s.status === "active" ? "Tạm ngưng" : "Kích hoạt"
                          }
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {s.status === "active" ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            )}
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Dummy */}
        <div className="app-table-summary mt-auto">
          <p>
            Hiển thị 1 - {stations.length} trong {total} nhà ga
          </p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400">
              &lt;
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-medium shadow-sm">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50">
              3
            </button>
            <span className="w-8 h-8 flex items-center justify-center tracking-widest text-gray-400">
              ...
            </span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400">
              &gt;
            </button>
          </div>
        </div>
      </div>

      <StationFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        station={editingStation}
        onSubmit={handleFormSubmit}
      />

      <DeactivateConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        station={targetStation}
        onConfirm={handletoggleConfirm}
      />
    </div>
  );
}
